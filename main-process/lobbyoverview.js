const {app, ipcMain} = require('electron');

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

// =====================================================
// This will be called on the load of the lobby overview
ipcMain.on('requestSavedLobbies', (event, arg) => {
    event.sender.send('requestedLobbies', store.get('lobby'));
});

// ====================================
// This is called when deleting a lobby
ipcMain.on('deleteLobby', (event, arg) => {
    store.delete(`lobby.${arg}`);

    // Send a response to the front end
    event.sender.send('deletedLobby', true);
});