const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const rp = require('request-promise');

const Store = require('electron-store');
const store = new Store();

// ===============================================
// This is called when you try to save the API key
ipcMain.on('saveAPIKey', (event, apiKey) => {
    rp(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=2407265`).then(user => {
        store.set('api-key', {
            'key': apiKey,
            'valid': true
        });

        // =======================================================
        // Send a message to frontend that the data has been saved
        event.sender.send(`savedData`, true);
    }).catch(function(err) {
        err = JSON.parse(err.error);

        event.sender.send(`errorMessage`, err.error);
    });
});

// ==============================================
// This is called when you load the settings page
ipcMain.on('requestAPIKey', (event, arg) => {
    const apiKey = store.get('api-key.key');

    if(apiKey !== undefined) {
        // Send the api key back to the front end
        event.sender.send('requestedAPIKey', apiKey);
    }
});

// =============================================
// This is called when exporting the config file
ipcMain.on('exportConfigFile', (event, arg) => {
    // ===================
    // Show a save window
    dialog.showSaveDialog({
        'title': 'Export the config file',
        'defaultPath': 'export.json'
    }, fileLocation => {
        // =====================================
        // Check if a location has been selected
        if(fileLocation != null) {
            let configFile = store.store;

            // Remove the api key from the content
            configFile['api-key'] = {"key": "redacted", "valid": true};

            // ========================================
            // Create the file at the selected location
            fs.writeFile(fileLocation, JSON.stringify(configFile, null, '\t'), err => {
                // Check if there was an error
                if(err) {
                    event.sender.send('exportedConfigFile', {
                        'error': `We encountered an error while trying to save the file: ${err.message}`
                    });
                }
                // There was no error, send confirmation
                else {
                    event.sender.send('exportedConfigFile', {
                        'success': `Succesfully saved the file to "${fileLocation}".`
                    });
                }
            });
        }
    });
});

// =================================================
// This is called when attempting to clear the cache
ipcMain.on('clearCache', (event, arg) => {
    store.delete('cache');
    store.set('cache', {"beatmaps": {}, "users": {}, "modifiers": {}});

    // Send a response to the front end
    event.sender.send('clearedCache', true);
});

// ====================================================
// This is called when attempting to remove the api key
ipcMain.on('removeApiKey', (event, arg) => {
    store.delete('api-key');
    store.set('api-key', {"key": "", "valid": false});

    // Send a response to the front end
    event.sender.send('removedApiKey', true);
});

// ===========================================
// This is called when exporting the modifiers
ipcMain.on('exportModifiers', (event, arg) => {
    // ===================
    // Show a save window
    dialog.showSaveDialog({
        'title': 'Export the modifiers',
        'defaultPath': 'modifiers.json'
    }, fileLocation => {
        // =====================================
        // Check if a location has been selected
        if(fileLocation != null) {
            const allModifiers = store.get('cache.modifiers');

            // ========================================
            // Create the file at the selected location
            fs.writeFile(fileLocation, JSON.stringify(allModifiers, null, '\t'), err => {
                // Check if there was an error
                if(err) {
                    event.sender.send('exportedModifiers', {
                        'error': `We encountered an error while trying to save the file: ${err.message}`
                    });
                }
                // There was no error, send confirmation
                else {
                    event.sender.send('exportedModifiers', {
                        'success': `Succesfully saved the file to "${fileLocation}".`
                    });
                }
            });
        }
    });
});