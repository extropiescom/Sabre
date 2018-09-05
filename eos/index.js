const electron = require("electron");
const is = require("electron-is");

// Module to control application life.
const app = electron.app;
const dialog = electron.dialog;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

if (is.dev()) {
    process.env.LIBDIR = __dirname + "/dllimport/";
} else {
    process.env.LIBDIR =
        app.getAppPath() + "/../app.asar.unpacked/src/main/dllimport/";
}

// updater
const { autoUpdater } = require("electron-updater");
const updateHandle = () => {
    autoUpdater.autoDownload = false;
    function sendStatusToWindow(text) {
        console.log(text);
        mainWindow.webContents.send("message", text);
    }
    autoUpdater.on("checking-for-update", () => {
        sendStatusToWindow("Checking for update...");
    });
    autoUpdater.on("update-available", info => {
        sendStatusToWindow("Update available.");
        const index = dialog.showMessageBox({
            type: "info",
            buttons: ["确定", "取消"],
            title: "软件更新",
            message: "发现新版本，点击确定后开始下载：version " + info.version,
            detail: "强烈建议更新到最新版本"
        });
        if (index === 0) {
            autoUpdater.downloadUpdate();
        }
    });
    autoUpdater.on("update-not-available", info => {
        console.log("update-not-available:" + info);
        sendStatusToWindow("Update not available.");
    });
    autoUpdater.on("error", err => {
        sendStatusToWindow("Error in auto-updater. " + err);
    });
    autoUpdater.on("download-progress", progressObj => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message =
            log_message + " - Downloaded " + progressObj.percent + "%";
        log_message =
            log_message +
            " (" +
            progressObj.transferred +
            "/" +
            progressObj.total +
            ")";
        sendStatusToWindow(log_message);
    });
    autoUpdater.on("update-downloaded", info => {
        //console.log("update-downloaded:" + info);
        sendStatusToWindow("Update downloaded");
        const index = dialog.showMessageBox({
            type: "info",
            buttons: ["现在重启", "稍后重启"],
            title: "软件更新",
            message:
                "新版本已下载，将在重启程序后更新至：version " + info.version
        });

        if (index === 0) {
            try {
                autoUpdater.quitAndInstall();
            } catch (e) {
                dialog.showErrorBox("安装失败", "无法安装更新程序。");
            }
        }
    });
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    //react devtools
    //BrowserWindow.addDevToolsExtension("C:\\Users\\ximin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\3.2.3_0");
    //redux devtools
    //BrowserWindow.addDevToolsExtension("C:\\Users\\ximin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\lmhkpmbekcpmknklioeibfkpmmfibljd\\2.15.2_0");
    //react perf
    //BrowserWindow.addDevToolsExtension("C:\\Users\\ximin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\hacmcodfllhbnekmghgdlplbdnahmhmm\\1.1.0_0");

    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1180, height: 800 });

    // and load the index.html of the app.
    if (is.dev()) {
        console.log("dev");
        mainWindow.loadURL("http://localhost:8080/#/eospage");
    } else {
        console.log("product");
        mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "../../public/index.html"),
                protocol: "file:",
                slashes: true
            })
        );
    }

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    updateHandle();
    //autoUpdater.setFeedURL("http://127.0.0.1:8081");
    autoUpdater.setFeedURL(
        "http://118.31.68.5/7-dragon-ball-wallet/personal/Client/EWalletElectronTest/win10/"
    );
    autoUpdater.checkForUpdatesAndNotify();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
