const {app, BrowserWindow, ipcMain} = require('electron');
const path              = require('path');
const url               = require('url');
const Store             = require('electron-store');
const fnc               = require('./plugins/functions.js');
const rp                = require('request-promise');

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

ipcMain.on('saveAPIKey', (event, apiKey) => {
    store.set('api-key', apiKey);

    // =======================================================
    // Send a message to frontend that the data has been saved
    mainWindow.webContents.send(`savedData`, true);
});

// ==============================================
// This is called when you load the settings page
ipcMain.on('requestAPIKey', (event, arg) => {
    const apiKey = store.get('api-key');

    if(apiKey !== undefined) {
        // Send the api key back to the front end
        mainWindow.webContents.send('requestedAPIKey', apiKey);
    }
});

// ===========================================
// This will be called when you create a lobby
ipcMain.on('createLobby', (event, arg) => {
    const lobbyToken = fnc.createToken(10);

    // Store the settings
    store.set(`lobby.${lobbyToken}.data`, {
        description:        arg['match-description'],
        multiplayerLink:    arg['match-url'],
        teamOneName:        arg['team-one-name'],
        teamTwoName:        arg['team-two-name']
    });

    // ==========================================================
    // Send a message to frontend that the match has been created
    mainWindow.webContents.send(`matchHasBeenCreated`, lobbyToken);
});

// =====================================================
// This will be called on the load of the lobby overview
ipcMain.on('requestSavedLobbies', (event, arg) => {
    mainWindow.webContents.send('requestedLobbies', store.get('lobby'));
});

// =========================================================
// This will be called when you are loading a specific lobby
ipcMain.on('requestMultiplayerLobby', (event, lobbyId) => {
    const allLobbies = store.get('lobby');

    // Check if the lobby exists
    if(allLobbies.hasOwnProperty(lobbyId)) {
        mainWindow.webContents.send('requestedLobby', {
            lobby: allLobbies[lobbyId],
            maps: allLobbies[lobbyId].multiplayerData,
            cache: store.get('cache')
        });
    }
});

// ==========================================================
// This is called when the user requests new multiplayer data
ipcMain.on('retrieveMultiplayerData', async (event, lobbyId) => {
    const apiKey    = store.get('api-key');
    const lobby     = store.get(`lobby.${lobbyId}`);

    // Check if the lobby exists
    if(lobby) {
        const multiplayerId = fnc.getMultiplayerIdFromUrl(lobby.data.multiplayerLink);

        await rp(`https://osu.ppy.sh/api/get_match?k=${apiKey}&mp=${multiplayerId}`).then(multiplayerLobby => {
            multiplayerLobby = JSON.parse(multiplayerLobby);

            for(let game in multiplayerLobby.games) {
                store.set(`lobby.${lobbyId}.multiplayerData.${multiplayerLobby.games[game].game_id}`, multiplayerLobby.games[game]);
            }
        });

        const allMaps = store.get(`lobby.${lobbyId}.multiplayerData`);
        let beatmapCache = store.get(`cache.beatmaps`);

        for(let map in allMaps) {
            const currentMap = allMaps[map];
            const currentBeatmapId = currentMap.beatmap_id;

            if(beatmapCache == undefined || !beatmapCache.hasOwnProperty(currentBeatmapId)) {
                await rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${currentBeatmapId}&m=2&a=1`).then(beatmap => {
                    beatmap = JSON.parse(beatmap);

                    store.set(`cache.beatmaps.${currentBeatmapId}`, {
                        name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                        beatmapset_id: beatmap[0].beatmapset_id
                    });
                });
            }
        }
    }
}); 

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