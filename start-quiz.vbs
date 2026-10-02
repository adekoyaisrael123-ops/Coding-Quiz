Set WshShell = CreateObject("WScript.Shell")

projectFolder = WScript.ScriptFullName
projectFolder = Left(projectFolder, InStrRev(projectFolder, "\"))

WshShell.CurrentDirectory = projectFolder

WshShell.Run "cmd /c node server.js", 0, False

WScript.Sleep 2000

WshShell.Run "http://localhost:5000", 1, False