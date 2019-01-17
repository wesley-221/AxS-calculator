const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const fnc = require('../plugins/functions.js');
const rp = require('request-promise');

const Bitbucket = require('bitbucket');
const bitbucket = new Bitbucket();

const Store = require('electron-store');
const store = new Store();

// ======================================
// This is called when accessing any page
ipcMain.on('checkVersion', (event, arg) => {
    // =====================================================================
    // Check if the version is the latest version, if not send out a warning
    bitbucket.repositories.getSrc({
        'username': 'wesley221',
        'repo_slug': 'axs-calculator',
        'node': 'master',
        'path': 'package.json'
    }).then(({data, headers}) => {
        data = JSON.parse(data);

        const   currentVersion = app.getVersion()
                remoteVersion = data.version;        
        
        // ==================
        // The version is old
        if(currentVersion < remoteVersion) {
            event.sender.send('oldVersion', {
                'currentVersion': currentVersion,
                'latestVersion': remoteVersion
            });
        }
    });
});

// ========================================================
// This is called on the pages where an API key is required
ipcMain.on('requestApiValidation', (event, arg) => {
    const apiKeyValid = store.get('api-key.valid');

    // Send back the state of the api key to the front end
    event.sender.send(`onRequestedApiValidation`, apiKeyValid);
});

// ==================================================
// This is called when a user loads the modifier page
ipcMain.on('requestAllModifiers', (event, arg) => {
    const allModifiers = store.get('cache.modifiers');

    // Send back a response to the front end
    event.sender.send('requestedModifiers', allModifiers);
});

// =======================================
// This is called when importing modifiers
ipcMain.on('importModifiers', (event, arg) => {
    // =======================
    // Show a file open window
    dialog.showOpenDialog({
        'title': 'Import modifiers',
        'defaultPath': 'modifiers.json',
        'filters': [
            {name: 'json', extensions: ['json']}
        ]
    }, fileLocation => {
        // =====================================
        // Check if a location has been selected
        if(fileLocation != undefined) {
            fileLocation = fileLocation[0];

            // ======================
            // Read the selected file
            fs.readFile(fileLocation, 'utf-8', (err, data) => {
                // ================
                // Check for errors
                if(err) {
                    dialog.showErrorBox('Error!', `There was an error trying to import the file: ${err.message}.`);
                }
                else {
                    data = JSON.parse(data);

                    // Loop through the beatmaps
                    for(let beatmap in data) {
                        // Check for errors
                        if(isNaN(beatmap)) {
                            dialog.showErrorBox('Error!', `The format of the imported file is correct.`);
                            return;
                        }

                        // Check for errors
                        if(!data[beatmap].hasOwnProperty('beatmap_name') || !data[beatmap].hasOwnProperty('beatmap_id') || !data[beatmap].hasOwnProperty('modifier')) {
                            dialog.showErrorBox('Error!', `The format of the imported file is correct.`);
                            return;
                        }

                        // Save the modifier
                        store.set(`cache.modifiers.${beatmap}`, data[beatmap]);
                    }

                    // ================
                    // Show message box
                    dialog.showMessageBox({
                        'type': 'info',
                        'message': 'Successfully imported the modifiers.'
                    });

                    // Send message when modifiers have been imported
                    event.sender.send('requestedModifiers', store.get('cache.modifiers'));
                }
            });
        }
    });
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
        rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${beatmapId}&m=2&a=1`).then(beatmap => {
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
    event.sender.send('modifierCreated', arg.beatmapUrl);
});

// =======================================
// This is called when deleting a modifier
ipcMain.on('deleteModifier', (event, arg) => {
    store.delete(`cache.modifiers.${arg}`);

    // Send a response to the front end
    event.sender.send('deletedModifier', arg);
});