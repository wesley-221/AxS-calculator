const {app, ipcMain} = require('electron');

const Bitbucket = require('bitbucket');
const bitbucket = new Bitbucket();

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