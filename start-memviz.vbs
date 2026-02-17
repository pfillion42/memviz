Set WshShell = CreateObject("WScript.Shell")
sFolder = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & sFolder & "start-memviz.ps1""", 0, False
