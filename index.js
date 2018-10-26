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


initialize = async () => {
    const cache = store.get('cache');

    // Create the cache if it doesn't exist
    if(cache == undefined)
        await store.set('cache', {"beatmaps": {}, "users": {}, "modifiers": {}});

    const apiKey = store.get('api-key');

    // Create the api-key if it doesn't exist
    if(apiKey == undefined)
        await store.set('api-key', {"key": "", "valid": false});
}

// ==================
// Initialize the app
app.on('ready', () => {
    mainWindow = new BrowserWindow({icon: __dirname + '/web/resources/images/axs.ico', backgroundColor: '#3C4452'}); 

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
    rp(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=2407265`).then(user => {
        store.set('api-key', {
            'key': apiKey,
            'valid': true
        });

        // =======================================================
        // Send a message to frontend that the data has been saved
        mainWindow.webContents.send(`savedData`, true);
    }).catch(function(err) {
        err = JSON.parse(err.error);

        mainWindow.webContents.send(`errorMessage`, err.error);
    });
});

// ========================================================
// This is called on the pages where an API key is required
ipcMain.on('requestApiValidation', (event, arg) => {
    const apiKeyValid = store.get('api-key.valid');

    // Send back the state of the api key to the front end
    mainWindow.webContents.send(`onRequestedApiValidation`, apiKeyValid);
});

// ==============================================
// This is called when you load the settings page
ipcMain.on('requestAPIKey', (event, arg) => {
    const apiKey = store.get('api-key.key');

    if(apiKey !== undefined) {
        // Send the api key back to the front end
        mainWindow.webContents.send('requestedAPIKey', apiKey);
    }
});

// ===========================================
// This will be called when you create a lobby
ipcMain.on('createLobby', async (event, arg) => {
    const lobbyToken = fnc.createToken(10);

    // Store the settings
    store.set(`lobby.${lobbyToken}.data`, {
        description:        arg['match-description'],
        multiplayerLink:    arg['match-url'],
        teamOneName:        arg['team-one-name'],
        teamTwoName:        arg['team-two-name']
    });

    const apiKey        = store.get('api-key.key');
    let cache           = store.get('cache');
    const multiplayerId = fnc.getMultiplayerIdFromUrl(arg['match-url']);

    await rp(`https://osu.ppy.sh/api/get_match?k=${apiKey}&mp=${multiplayerId}`).then(async multiplayerLobby => {
        multiplayerLobby = JSON.parse(multiplayerLobby);

        // Loop through all the games
        for(let game in multiplayerLobby.games) {
            const currentGame = multiplayerLobby.games[game];
            let gameScore = {};
            let currentModifier;

            if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
            }
            else {
                currentModifier = 0;
            }

            // Loop through all the scores of the current map
            for(let score in currentGame.scores) {
                const currentScore = currentGame.scores[score];

                // Check if the user has been cached, if not cache it
                if(!cache.users.hasOwnProperty(currentScore.user_id)) {
                    await rp(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=${currentScore.user_id}`).then(user => {
                        user = JSON.parse(user);
                        
                        cache.users[currentScore.user_id] = user[0].username;
                        store.set(`cache.users.${currentScore.user_id}`, user[0].username);
                    });
                }

                // Accuracy players
                if(['0','3'].indexOf(currentScore.slot) > -1) {
                    gameScore.user = currentScore.user_id;
                    gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateAccuracyPlayerScore(currentScore.score));
                    gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                    gameScore.passed = currentScore.pass;

                    store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                }
                // Score players
                else if(['1','2','4','5'].indexOf(currentScore.slot) > -1) {
                    gameScore.user = currentScore.user_id;
                    gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateScorePlayerScore(currentScore.score, fnc.getAccuracyOfScore(currentScore), currentModifier));
                    gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                    gameScore.passed = currentScore.pass;

                    store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                }

                store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.beatmap_id`, currentGame.beatmap_id);
            }

            // Check if the beatmap has been cached, if not cache it
            if(!cache.beatmaps.hasOwnProperty(currentGame.beatmap_id)) {
                await rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${currentGame.beatmap_id}&m=2&a=1`).then(beatmap => {
                    beatmap = JSON.parse(beatmap);

                    store.set(`cache.beatmaps.${currentGame.beatmap_id}`, {
                        name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                        beatmapset_id: beatmap[0].beatmapset_id
                    });
                });
            }
        }
    }).finally(() => {
        const multiplayerGames = store.get(`lobby.${lobbyToken}.multiplayerData`);

        // Loop through the games
        for(let game in multiplayerGames) {
            let currentGame = multiplayerGames[game];
            let currentModifier;

            // ===================
            // Handle the modifier
            if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
            }
            else {
                currentModifier = 0;
            }

            // ================================================
            // Set undefined scores to 0 score and 85% accuracy
            for(let i = 0; i < 6; i ++) {
                if(currentGame[i] == undefined) {
                    currentGame[i] = {"user": "-1", "score": "0", "accuracy": "85.00", "passed": "0"};

                    store.set(`lobby.${lobbyToken}.multiplayerData.${game}.${i}`, currentGame[i]);
                }
            }

            const finalTeamOneScore = parseFloat(fnc.calculateTeamScore(currentGame[0].score, currentGame[1].score, currentGame[2].score, currentGame[0].accuracy, currentModifier));
            const finalTeamTwoScore = parseFloat(fnc.calculateTeamScore(currentGame[3].score, currentGame[4].score, currentGame[5].score, currentGame[3].accuracy, currentModifier));

            store.set(`lobby.${lobbyToken}.multiplayerData.${game}.team_one_score`, finalTeamOneScore);
            store.set(`lobby.${lobbyToken}.multiplayerData.${game}.team_two_score`, finalTeamTwoScore);
        }
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
    const apiKey    = store.get('api-key.key');
    const lobby     = store.get(`lobby.${lobbyId}`);
    let cache       = store.get(`cache`);

    // Check if the lobby exists
    if(lobby) {
        const multiplayerId = fnc.getMultiplayerIdFromUrl(lobby.data.multiplayerLink);

        await rp(`https://osu.ppy.sh/api/get_match?k=${apiKey}&mp=${multiplayerId}`).then(async multiplayerLobby => {
            multiplayerLobby = JSON.parse(multiplayerLobby);

            // Loop through all the games
            for(let game in multiplayerLobby.games) {
                const currentGame = multiplayerLobby.games[game];
                let gameScore = {};
                let currentModifier;

                if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                    currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
                }
                else {
                    currentModifier = 0;
                }

                // Loop through all the scores of the current map
                for(let score in currentGame.scores) {
                    const currentScore = currentGame.scores[score];

                    // Check if the user has been cached, if not cache it
                    if(!cache.users.hasOwnProperty(currentScore.user_id)) {
                        await rp(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=${currentScore.user_id}`).then(user => {
                            user = JSON.parse(user);
                            
                            cache.users[currentScore.user_id] = user[0].username;
                            store.set(`cache.users.${currentScore.user_id}`, user[0].username);
                        });
                    }

                    // Accuracy players
                    if(['0','3'].indexOf(currentScore.slot) > -1) {
                        gameScore.user = currentScore.user_id;
                        gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateAccuracyPlayerScore(currentScore.score));
                        gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                        gameScore.passed = currentScore.pass;

                        store.set(`lobby.${lobbyId}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                    }
                    // Score players
                    else if(['1','2','4','5'].indexOf(currentScore.slot) > -1) {
                        gameScore.user = currentScore.user_id;
                        gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateScorePlayerScore(currentScore.score, fnc.getAccuracyOfScore(currentScore), currentModifier));
                        gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                        gameScore.passed = currentScore.pass;

                        store.set(`lobby.${lobbyId}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                    }

                    store.set(`lobby.${lobbyId}.multiplayerData.${currentGame.game_id}.beatmap_id`, currentGame.beatmap_id);
                }

                // Check if the beatmap has been cached, if not cache it
                if(!cache.beatmaps.hasOwnProperty(currentGame.beatmap_id)) {
                    await rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${currentGame.beatmap_id}&m=2&a=1`).then(beatmap => {
                        beatmap = JSON.parse(beatmap);

                        cache.beatmaps[currentGame.beatmap_id] = {
                            name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                            beatmapset_id: beatmap[0].beatmapset_id
                        };

                        store.set(`cache.beatmaps.${currentGame.beatmap_id}`, {
                            name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                            beatmapset_id: beatmap[0].beatmapset_id
                        });
                    });
                }
            }
        }).finally(() => {
            const multiplayerGames = store.get(`lobby.${lobbyId}.multiplayerData`);

            // Loop through the games
            for(let game in multiplayerGames) {
                let currentGame = multiplayerGames[game];
                let currentModifier;

                // ===================
                // Handle the modifier
                if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                    currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
                }
                else {
                    currentModifier = 0;
                }

                // ================================================
                // Set undefined scores to 0 score and 85% accuracy
                for(let i = 0; i < 6; i ++) {
                    if(currentGame[i] == undefined) {
                        currentGame[i] = {"user": "-1", "score": "0", "accuracy": "85.00", "passed": "0"};

                        store.set(`lobby.${lobbyId}.multiplayerData.${game}.${i}`, currentGame[i]);
                    }
                }

                const finalTeamOneScore = parseFloat(fnc.calculateTeamScore(currentGame[0].score, currentGame[1].score, currentGame[2].score, currentGame[0].accuracy, currentModifier));
                const finalTeamTwoScore = parseFloat(fnc.calculateTeamScore(currentGame[3].score, currentGame[4].score, currentGame[5].score, currentGame[3].accuracy, currentModifier));

                store.set(`lobby.${lobbyId}.multiplayerData.${game}.team_one_score`, finalTeamOneScore);
                store.set(`lobby.${lobbyId}.multiplayerData.${game}.team_two_score`, finalTeamTwoScore);
            }

            mainWindow.webContents.send('refreshPage', true);
        });
    }
});

// ==================================================
// This is called when a user loads the modifier page
ipcMain.on('requestAllModifiers', (event, arg) => {
    const allModifiers = store.get('cache.modifiers');

    // Send back a response to the front end
    mainWindow.webContents.send('requestedModifiers', allModifiers);
});

// =========================================================
// This is called when a user succesfully creates a modifier
ipcMain.on('createBeatmapModifier', async (event, arg) => {
    const apiKey    = store.get('api-key.key');
    const beatmapId = fnc.getBeatmapIdFromUrl(arg.beatmapUrl);
    let cache       = store.get('cache');

    // Check if the beatmap was already cached
    if(cache.beatmaps.hasOwnProperty(beatmapId)) {
        store.set(`cache.modifiers.${beatmapId}`, {
            'beatmap_name': cache.beatmaps[beatmapId].name,
            'beatmap_id': beatmapId,
            'modifier': arg.modifier
        });
    }
    else {
        await rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${beatmapId}&m=2&a=1`).then(beatmap => {
            beatmap = JSON.parse(beatmap);
            
            cache.beatmaps[beatmapId] = {
                name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                beatmapset_id: beatmap[0].beatmapset_id
            };

            store.set(`cache.beatmaps.${beatmapId}`, {
                name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                beatmapset_id: beatmap[0].beatmapset_id
            });

            store.set(`cache.modifiers.${beatmapId}`, {
                'beatmap_name': `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                'beatmap_id': beatmapId,
                'modifier': arg.modifier
            });
        });   
    }

    // Send back a responserequestedLobby to the front end 
    mainWindow.webContents.send('modifierCreated', arg.beatmapUrl);
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