# Quantum Todo desktop pet

This Windows-only companion draws one animated pixel monster per pending task in a transparent, always-on-top strip above the taskbar. Creatures evolve from fresh to mutant to boss according to task age. The web app syncs task IDs and creation times locally; completed or deleted tasks disappear from the strip. The overlay patrols the primary display, turns around at both edges, and does not intercept mouse clicks.

## Start

Start the local Quantum Todo web app and double-click `Start-Desktop-Pet.cmd`, or run `Start-QuantumTodoDesktopPet.ps1` from PowerShell. Keep the local web app open while changing tasks so it can sync the latest list. After syncing, switch to any website and the monsters keep running.

## Stop

Press **Ctrl+Shift+Q**, or run `Stop-QuantumTodoDesktopPet.ps1`.

The companion runs for the current Windows session. It does not add itself to Windows startup.
