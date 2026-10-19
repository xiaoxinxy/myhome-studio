param([switch]$SkipWebBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if ($projectRoot -match '[^\x00-\x7F]') {
    # Vite resolves mapped drive paths back to their Unicode location. Build
    # web assets at the real root; only Android's native tools need ASCII paths.
    if (!$SkipWebBuild) {
        Push-Location -LiteralPath $projectRoot
        $previousNativeMode = $env:VITE_NATIVE_APP
        try {
            $env:VITE_NATIVE_APP = '1'
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw 'Web build failed.' }
        } finally {
            Pop-Location
            $env:VITE_NATIVE_APP = $previousNativeMode
        }
        $SkipWebBuild = $true
    }
    # AAPT2 on Windows cannot reliably open Unicode absolute paths. Map this
    # existing directory to an unused drive for the duration of the build.
    $buildDrive = @('Q:','R:','S:','T:','U:','V:','W:','X:','Y:','Z:') | Where-Object { !(Test-Path "$_\") } | Select-Object -First 1
    if (!$buildDrive) { throw 'No unused drive letter is available for Android packaging.' }
    $previousSdkEnv = $env:MYHOME_ANDROID_SDK
    $sdkSource = $previousSdkEnv
    if (!$sdkSource) { $sdkSource = Join-Path $projectRoot '.android-tools/sdk' }
    if (!(Test-Path -LiteralPath $sdkSource)) { throw 'Run scripts/setup-android.ps1 to install SDK tools first.' }
    $sdkDrive = @('Q:','R:','S:','T:','U:','V:','W:','X:','Y:','Z:') | Where-Object { $_ -ne $buildDrive -and !(Test-Path "$_\") } | Select-Object -First 1
    if (!$sdkDrive) { throw 'No unused drive letter for Android SDK.' }
    & subst.exe $sdkDrive $sdkSource
    if ($LASTEXITCODE -ne 0) { throw 'Could not map Android SDK.' }
    $env:MYHOME_ANDROID_SDK = "$sdkDrive\"
    & subst.exe $buildDrive $projectRoot
    if ($LASTEXITCODE -ne 0) { throw 'Could not map the build directory.' }
    try {
        $childArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$buildDrive\scripts\build-android.ps1")
        if ($SkipWebBuild) { $childArgs += '-SkipWebBuild' }
        & (Get-Process -Id $PID).Path @childArgs
        if ($LASTEXITCODE -ne 0) { throw 'Android packaging failed.' }
    } finally { & subst.exe $buildDrive /d; & subst.exe $sdkDrive /d; $env:MYHOME_ANDROID_SDK = $previousSdkEnv }
    return
}
Set-Location -LiteralPath $projectRoot
$toolsRoot = Join-Path $projectRoot '.android-tools'
$sdkRoot = $env:MYHOME_ANDROID_SDK
if (!$sdkRoot) { $sdkRoot = Join-Path $toolsRoot 'sdk' }
$buildTools = Join-Path $sdkRoot 'android-15'
$platformJar = Join-Path $sdkRoot 'android-35-ext15/android.jar'
$javaBin = Split-Path (Get-Command javac.exe -ErrorAction Stop).Source -Parent
$nativeRoot = Join-Path $projectRoot 'android-app'
$buildRoot = Join-Path $nativeRoot 'build'
$classesRoot = Join-Path $buildRoot 'classes'
$assetsRoot = Join-Path $nativeRoot 'assets'
$signingRoot = Join-Path $projectRoot '.android-signing'
$outputRoot = Join-Path $projectRoot '安装包'
[xml]$androidManifest = [IO.File]::ReadAllText("$nativeRoot/AndroidManifest.xml")
$appVersion = $androidManifest.manifest.GetAttribute('versionName','http://schemas.android.com/apk/res/android')
foreach ($directory in @($buildRoot,$classesRoot,$assetsRoot,$signingRoot,$outputRoot)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}
function Invoke-Checked([string]$File, [string[]]$Arguments) {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Command failed: $File (exit $LASTEXITCODE)" }
}
if (!(Test-Path -LiteralPath $platformJar) -or !(Test-Path -LiteralPath "$buildTools/aapt2.exe")) {
    throw 'Android tools not found. Run scripts/setup-android.ps1 first.'
}
if (!$SkipWebBuild) {
    $env:VITE_NATIVE_APP = '1'
    try { Invoke-Checked 'npm.cmd' @('run','build') }
    finally { Remove-Item Env:VITE_NATIVE_APP -ErrorAction SilentlyContinue }
}
# Replace only the generated web assets; the checked path is inside this project.
$webAssets = [IO.Path]::GetFullPath((Join-Path $assetsRoot 'web'))
if (!$webAssets.StartsWith($projectRoot.TrimEnd('\') + [IO.Path]::DirectorySeparatorChar)) { throw 'Invalid generated asset path' }
if (Test-Path -LiteralPath $webAssets) { Remove-Item -LiteralPath $webAssets -Recurse -Force }
New-Item -ItemType Directory -Path $webAssets | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'dist/*') -Destination $webAssets -Recurse

$compiledResources = Join-Path $buildRoot 'resources.zip'
$unsignedApk = Join-Path $buildRoot 'unsigned.apk'
$alignedApk = Join-Path $buildRoot 'aligned.apk'
$classJar = Join-Path $buildRoot 'classes.jar'
Invoke-Checked "$buildTools/aapt2.exe" @('compile','--dir',"$nativeRoot/res",'-o',$compiledResources)
Invoke-Checked "$buildTools/aapt2.exe" @('link','-I',$platformJar,'--manifest',"$nativeRoot/AndroidManifest.xml",'--min-sdk-version','26','--target-sdk-version','35','-A',$assetsRoot,'-o',$unsignedApk,$compiledResources)
$javaFiles = @(Get-ChildItem -LiteralPath "$nativeRoot/src" -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
Invoke-Checked "$javaBin/javac.exe" (@('-encoding','UTF-8','--release','8','-classpath',$platformJar,'-d',$classesRoot) + $javaFiles)
Invoke-Checked "$javaBin/jar.exe" @('cf',$classJar,'-C',$classesRoot,'.')
Invoke-Checked "$javaBin/java.exe" @('-cp',"$buildTools/lib/d8.jar",'com.android.tools.r8.D8','--lib',$platformJar,'--min-api','26','--output',$buildRoot,$classJar)
Push-Location -LiteralPath $buildRoot
try { Invoke-Checked "$javaBin/jar.exe" @('uf',$unsignedApk,'classes.dex') }
finally { Pop-Location }
# Windows AAPT2 can write backslashes into asset ZIP entry names. Android's
# AssetManager requires forward slashes. Normalize before alignment/signing.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$normalizedApk = Join-Path $buildRoot 'normalized.apk'
if (Test-Path -LiteralPath $normalizedApk) { Remove-Item -LiteralPath $normalizedApk -Force }
$sourceZip = [IO.Compression.ZipFile]::OpenRead($unsignedApk)
$targetZip = [IO.Compression.ZipFile]::Open($normalizedApk,[IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($entry in $sourceZip.Entries) {
        $name = $entry.FullName.Replace('\','/')
        $compression = [IO.Compression.CompressionLevel]::Optimal
        if ($name -eq 'resources.arsc' -or $entry.CompressedLength -eq $entry.Length) {
            $compression = [IO.Compression.CompressionLevel]::NoCompression
        }
        $newEntry = $targetZip.CreateEntry($name,$compression)
        $inputStream = $entry.Open()
        $outputStream = $newEntry.Open()
        try { $inputStream.CopyTo($outputStream) }
        finally { $inputStream.Dispose(); $outputStream.Dispose() }
    }
} finally { $sourceZip.Dispose(); $targetZip.Dispose() }
# .NET Framework's NoCompression still uses the DEFLATE method. Android 11+
# requires the resource table to use ZIP STORED. Java's jar -0 writes that.
$resourceZip = [IO.Compression.ZipFile]::OpenRead($normalizedApk)
try {
    $resourceInput = $resourceZip.GetEntry('resources.arsc').Open()
    $resourceOutput = [IO.File]::Create((Join-Path $buildRoot 'resources.arsc'))
    try { $resourceInput.CopyTo($resourceOutput) }
    finally { $resourceInput.Dispose(); $resourceOutput.Dispose() }
} finally { $resourceZip.Dispose() }
Push-Location -LiteralPath $buildRoot
try { Invoke-Checked "$javaBin/jar.exe" @('uf0',$normalizedApk,'resources.arsc') }
finally { Pop-Location }
Invoke-Checked "$buildTools/zipalign.exe" @('-f','-p','4',$normalizedApk,$alignedApk)

$credentialsPath = Join-Path $signingRoot 'credentials.json'
$keystorePath = Join-Path $signingRoot 'home-release.keystore'
if (!(Test-Path -LiteralPath $credentialsPath)) {
    if (Test-Path -LiteralPath $keystorePath) { throw 'Signing credentials missing. Restore your backup instead of replacing the key.' }
    $randomBytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
    @{password=[Convert]::ToBase64String($randomBytes);alias='home-studio'} | ConvertTo-Json | Set-Content -LiteralPath $credentialsPath -Encoding utf8
}
$credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
$env:HOME_STUDIO_KEYSTORE_PASSWORD = $credentials.password
try {
    if (!(Test-Path -LiteralPath $keystorePath)) {
        Invoke-Checked "$javaBin/keytool.exe" @('-genkeypair','-keystore',$keystorePath,'-storetype','PKCS12','-alias',$credentials.alias,'-storepass:env','HOME_STUDIO_KEYSTORE_PASSWORD','-keypass:env','HOME_STUDIO_KEYSTORE_PASSWORD','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Private Courtyard Studio, OU=Private App, O=Home Studio, C=CN')
    }
    $signedApk = Join-Path $outputRoot "我的家-$appVersion.apk"
    Invoke-Checked "$javaBin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'sign','--ks',$keystorePath,'--ks-key-alias',$credentials.alias,'--ks-pass','env:HOME_STUDIO_KEYSTORE_PASSWORD','--key-pass','env:HOME_STUDIO_KEYSTORE_PASSWORD','--out',$signedApk,$alignedApk)
    Invoke-Checked "$javaBin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'verify','--verbose','--print-certs',$signedApk)
    Invoke-Checked "$buildTools/zipalign.exe" @('-c','-p','4',$signedApk)
    & "$PSScriptRoot/verify-apk.ps1" -ApkPath $signedApk
    $apkStream = [IO.File]::OpenRead($signedApk)
    try { $hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($apkStream)).Replace('-','').ToLower() }
    finally { $apkStream.Dispose() }
    "$hash  我的家-$appVersion.apk" | Set-Content -LiteralPath "$outputRoot/SHA256.txt" -Encoding utf8
    Write-Output "APK ready: $signedApk"
} finally { Remove-Item Env:HOME_STUDIO_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue }
