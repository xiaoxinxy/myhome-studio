param([Parameter(Mandatory=$true)][string]$ApkPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = Split-Path $PSScriptRoot -Parent
$extractRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'android-app/build/verified-web'))
$prefix = $extractRoot.TrimEnd('\') + '\'
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ApkPath).Path)
try {
    $names = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($entry in $zip.Entries) {
        if ($entry.FullName.Contains('\')) { throw "Invalid Android asset separator: $($entry.FullName)" }
        if (!$names.Add($entry.FullName)) { throw "Duplicate APK entry: $($entry.FullName)" }
    }
    foreach ($required in @('AndroidManifest.xml','resources.arsc','classes.dex','assets/web/index.html')) {
        if (!$names.Contains($required)) { throw "Missing APK entry: $required" }
    }
    $resources = $zip.GetEntry('resources.arsc')
    if ($resources.CompressedLength -ne $resources.Length) { throw 'Android resource table must not be compressed.' }
    $reader = New-Object IO.StreamReader($zip.GetEntry('assets/web/index.html').Open())
    try { $html = $reader.ReadToEnd() } finally { $reader.Dispose() }
    if ($html.Contains('registerSW') -or $names.Contains('assets/web/sw.js')) { throw 'Native app must not rely on a service worker.' }
    foreach ($match in [regex]::Matches($html,'(?:src|href)="([^"?#]+)"')) {
        $asset = $match.Groups[1].Value -replace '^\./',''
        if (!$names.Contains("assets/web/$asset")) { throw "HTML references a missing packaged asset: $asset" }
    }
    if (!$names.Where({$_.StartsWith('assets/web/assets/Scene-')}).Count) { throw '3D bundle missing from APK.' }
    # Extract from the signed APK, not from the pre-packaging staging folder.
    if (!$extractRoot.StartsWith($projectRoot.TrimEnd('\')+'\')) { throw 'Invalid verification directory' }
    if (Test-Path -LiteralPath $extractRoot) { Remove-Item -LiteralPath $extractRoot -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
    foreach ($entry in $zip.Entries) {
        if (!$entry.FullName.StartsWith('assets/web/') -or !$entry.Name) { continue }
        $relative = $entry.FullName.Substring('assets/web/'.Length)
        $destination = [IO.Path]::GetFullPath((Join-Path $extractRoot $relative))
        if (!$destination.StartsWith($prefix)) { throw 'Unsafe APK resource path' }
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
        $inputStream = $entry.Open()
        $outputStream = [IO.File]::Create($destination)
        try { $inputStream.CopyTo($outputStream) }
        finally { $inputStream.Dispose(); $outputStream.Dispose() }
    }
    Write-Output 'Verified signed APK: Android asset paths, homepage, referenced bundles, 3D bundle, resource table and offline independence.'
} finally { $zip.Dispose() }
