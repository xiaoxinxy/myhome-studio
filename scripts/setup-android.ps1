$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$toolsRoot = Join-Path $projectRoot '.android-tools'
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
$packages = @(
    @{File='platform-35-ext15_r01.zip';SHA1='ce757091f933b7ac646bf197ce8957cc73b95614'},
    @{File='build-tools_r35_windows.zip';SHA1='af059bb67cf7786f45ee0db85e2d24985df1b4b6'},
    @{File='platform-tools_r37.0.1-win.zip';SHA1='e03e78b1d80b396f1c3358e31251cb31740e1110'}
)
foreach ($package in $packages) {
    $zipPath = Join-Path $toolsRoot $package.File
    if (!(Test-Path -LiteralPath $zipPath)) {
        Invoke-WebRequest -Uri "https://dl.google.com/android/repository/$($package.File)" -OutFile $zipPath -TimeoutSec 180
    }
    if ((Get-FileHash -LiteralPath $zipPath -Algorithm SHA1).Hash -ne $package.SHA1) { throw "Checksum mismatch: $zipPath" }
    Expand-Archive -LiteralPath $zipPath -DestinationPath (Join-Path $toolsRoot 'sdk') -Force
}
Write-Output 'Android SDK tools ready. JDK 17+ is also required.'
