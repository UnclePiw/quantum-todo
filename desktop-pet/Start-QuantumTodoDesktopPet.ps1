$ErrorActionPreference = "Stop"
$petScript = Join-Path $PSScriptRoot "QuantumTodoDesktopPet.ps1"

$powershell = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
Start-Process -FilePath $powershell -ArgumentList @("-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-WindowStyle", "Hidden", "-File", "`"$petScript`"") -WindowStyle Hidden | Out-Null
Write-Output "Started the Quantum Todo desktop pet. Press Ctrl+Shift+Q or run Stop-QuantumTodoDesktopPet.ps1 to close it."
