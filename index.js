const {app, BrowserWindow, ipcMain} = require('electron');
const path              = require('path');
const url               = require('url');
const Store             = require('electron-store');

const store = new Store();

// ============================
// Create some global variables
let mainWindow;


initialize = () => {

}

// ==================
// Initialize the app
app.on('ready', () => {
    mainWindow = new BrowserWindow({icon: __dirname + '/web/resources/images/axs.png', backgroundColor: '#3C4452'}); 

    mainWindow.on('close', () => {
        mainWindow = null;
        app.quit();
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'web/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.maximize();

    initialize();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        initialize();
    }
});

// ==================================================
// Prevent the app from crashing when an error occurs
process.on("uncaughtException", err => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
    
    allErrors.push({
        type: 'uncaughtException',
        error: JSON.stringify(err)
    });
});

process.on("unhandledRejection", err => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Promise Error: ", errorMsg);

    allErrors.push({
        type: 'unhandledRejection',
        error: JSON.stringify(err)
    });
});