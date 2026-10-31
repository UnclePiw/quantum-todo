$ErrorActionPreference = "Stop"
try {
    $stopEvent = [System.Threading.EventWaitHandle]::OpenExisting("Local\QuantumTodoDesktopPet.Stop")
    [void]$stopEvent.Set()
    $stopEvent.Dispose()
    Write-Output "Stopped the Quantum Todo desktop pet."
} catch [System.Threading.WaitHandleCannotBeOpenedException] {
    Write-Output "Quantum Todo desktop pet is not running."
}
