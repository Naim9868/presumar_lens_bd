$env:EDGE = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = 'http://localhost:3000/smoke/pdf-harness.html?autorun=pdf&sink=http://127.0.0.1:3737'
$args = @(
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--window-size=1400,1800',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--enable-logging=stderr',
  '--v=0',
  $url
)
# Run Edge and wait for the sink to receive the PDF (max 30s).
$proc = Start-Process -FilePath $env:EDGE -ArgumentList $args -PassThru `
  -RedirectStandardOutput 'smoke\exports\edge.out' `
  -RedirectStandardError 'smoke\exports\edge.err'
Write-Host "edge pid:$($proc.Id)"

$timeoutAt = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $timeoutAt) {
  if (Test-Path 'smoke\exports\sales-report.pdf') {
    $size = (Get-Item 'smoke\exports\sales-report.pdf').Length
    if ($size -gt 5000) { break }
  }
  Start-Sleep -Milliseconds 500
}

# Give Edge a moment to flush, then stop it.
Start-Sleep -Seconds 1
if (-not $proc.HasExited) {
  try { $proc | Stop-Process -Force } catch { }
}
Write-Host "exit:$($proc.ExitCode)"