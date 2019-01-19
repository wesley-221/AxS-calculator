const {app, BrowserWindow} = require('electron');
const path              = require('path');
const glob              = require('glob');

const Store             = require('electron-store');
const store = new Store();

// ============================
// Create some global variables
let mainWindow,
    loadingWindow;

initialize = async () => {
    const cache = store.get('cache');

    // Create the cache if it doesn't exist
    if(cache == undefined)
        await store.set('cache', {"beatmaps": {}, "users": {}, "modifiers": {}});

    const apiKey = store.get('api-key');

    // Create the api-key if it doesn't exist
    if(apiKey == undefined)
        await store.set('api-key', {"key": "", "valid": false});

    const lobbyExists = store.get('lobby');

    if(lobbyExists == undefined) 
        await store.set('lobby', {});

    const shouldQuit = makeSingleInstance();
    if(shouldQuit) return app.quit();

    loadAllPages();

    createWindow = () => {
        const windowOptions = {
            title: app.getName(),
            icon: __dirname + '/assets/images/axs.ico',
            frame: false,
            titleBarStyle: 'hidden',
            show: false
        };

        // Check for OS
        if(process.platform === 'linux') {
            windowOptions.icon = path.join(__dirname, '/assets/images/axs.png');
        }

        mainWindow = new BrowserWindow(windowOptions);
        mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

        mainWindow.once('ready-to-show', () => {
            loadingWindow.destroy();

            mainWindow.show();
            mainWindow.maximize();
        });
    }

    createLoadingWindow = () => {
        const windowOptions = {
            title: app.getName(),
            icon: __dirname + '/assets/images/axs.ico',
            frame: false,
            titleBarStyle: 'hidden',
            show: false,
            width: 960,
            height: 540
        };

        // Check for OS
        if(process.platform === 'linux') {
            windowOptions.icon = path.join(__dirname, '/assets/images/axs.png');
        }

        loadingWindow = new BrowserWindow(windowOptions);
        loadingWindow.loadURL(path.join('file://', __dirname, '/loading.html'));

        loadingWindow.on('closed', () => {
            loadingWindow = null;
        });

        loadingWindow.once('ready-to-show', () => {
            loadingWindow.show();
        });
    }

    app.on('ready', () => {
        createLoadingWindow();

        loadingWindow.once('ready-to-show', () => {
            createWindow();
        })
    });

    app.on('window-all-closed', () => {
        if(process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if(mainWindow === null) {
            createWindow();
        }
    });
}

loadAllPages = () => {
    const allFiles = glob.sync(path.join(__dirname, 'main-process/**/*.js'));

    allFiles.forEach(file => {
        require(file);
    });
}

makeSingleInstance = () => {
    if(process.mas) return false;

    app.requestSingleInstanceLock();

    app.on('second-instance', () => {
        if(mainWindow) {
            if(mainWindow.isMinimized()) mainWindow.restore();

            mainWindow.focus();
        }
    });
}

// ==================================================
// Prevent the app from crashing when an error occurs
process.on("uncaughtException", err => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
});

process.on("unhandledRejection", err => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Promise Error: ", errorMsg);
});

initialize();