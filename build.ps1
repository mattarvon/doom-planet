# build.ps1 — bundle Doom Planet into ONE self-contained file: dist/doom-planet.html
# Inlines all CSS + JS and embeds every image as a base64 data URI, so the single
# file runs on any workstation (double-click) with no server and no external assets.
# (Still needs internet at runtime for map tiles, the Creepster font, and the APIs.)
#
#   pwsh -File build.ps1
param([string]$Root = $PSScriptRoot)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path

$html = Get-Content (Join-Path $Root "index.html") -Raw

# 1) inline the stylesheet
$css = Get-Content (Join-Path $Root "css/styles.css") -Raw
$html = $html -replace '<link rel="stylesheet" href="css/styles.css">', "<style>`n$css`n</style>"

# 2) build the embedded-image map (skip raw source dumps + screenshots)
$mime = @{ ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".webp" = "image/webp"; ".gif" = "image/gif" }
$imgDir = Join-Path $Root "assets/sharks"
$map = [ordered]@{}
Get-ChildItem $imgDir -File | Where-Object {
  $mime.ContainsKey($_.Extension.ToLower()) -and $_.Name -notmatch '^\d{3}-' -and $_.Name -notmatch 'Screenshot'
} | ForEach-Object {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName))
  $map["assets/sharks/$($_.Name)"] = "data:$($mime[$_.Extension.ToLower()]);base64,$b64"
}
$imgJson = ($map | ConvertTo-Json -Compress -Depth 3)
$imgScript = "<script>window.EMBEDDED_IMAGES=$imgJson;</script>"
"embedded $($map.Count) images"

# 3) inline every local <script src="js/*.js">, injecting EMBEDDED_IMAGES before embed.js
$rx = [regex]'<script src="js/([^"]+)"></script>'
$html = $rx.Replace($html, {
  param($m)
  $file = $m.Groups[1].Value
  $code = Get-Content (Join-Path $Root "js/$file") -Raw
  $inlined = "<script>`n$code`n</script>"
  if ($file -eq "embed.js") { return "$imgScript`n$inlined" }
  return $inlined
})

# 4) write the bundle
$dist = Join-Path $Root "dist"
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist | Out-Null }
$out = Join-Path $dist "doom-planet.html"
[IO.File]::WriteAllText($out, $html, (New-Object Text.UTF8Encoding($false)))
$kb = [math]::Round((Get-Item $out).Length / 1KB)
"wrote $out  ($kb KB)"
