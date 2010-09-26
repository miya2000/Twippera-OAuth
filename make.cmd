@if(0)==(0) ECHO OFF
if exist Widget_Twippera_oAuth.zip DEL Widget_Twippera_oAuth.zip
if exist Widget_Twippera_oAuth.wgt DEL Widget_Twippera_oAuth.wgt
CScript.exe //NoLogo //E:JScript "%~f0" Widget_Twippera_oAuth.zip config.xml index.html images js Changelog Lang License License-ja twippera.css twipperaRelease.txt
REN Widget_Twippera_oAuth.zip Widget_Twippera_oAuth.wgt
GOTO :EOF
@end

// zip compress command in wsh.
// @see http://scripting.cocolog-nifty.com/blog/2008/06/zip_3cb0.html
// @see http://n-arai.cocolog-nifty.com/blog/2008/04/activeserverpag_d5bc.html

if (WScript.Arguments.Count() < 2) {
    WScript.Echo("Usage: zip zipfile [ file1 file2 ...]");
    WScript.Quit();
}

var zipfile = WScript.Arguments.Item(0);
var fso = new ActiveXObject("Scripting.FileSystemObject");
var shell = new ActiveXObject("Shell.Application");

// check extension.
if (!/\.zip$/i.test(zipfile)) {
    WScript.Echo("Invalid Extension Name - ", zipfile);
    WScript.Quit();
}

// create new zip file. (overwrite)
var targetZip = fso.CreateTextFile(zipfile, true);
targetZip.Write("PK" + String.fromCharCode(5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0));
targetZip.Close();

// add zip entries.
var zipAsFolder = shell.NameSpace(fso.GetAbsolutePathName(zipfile));
for(var _ = 1, X = WScript.Arguments.Count(); _ < X; _++) {
    zipAsFolder.CopyHere(fso.GetAbsolutePathName(WScript.Arguments.Item(_)));
    while (X / _ / X) {
        WScript.Sleep(100);
        try {
            fso.OpenTextFile(zipfile, 8, false).Close();
            break;
        }
        catch (e) { /* writing */ }
    }
}
WScript.Quit();
