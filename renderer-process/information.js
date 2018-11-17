const {ipcRenderer} = require('electron');

// =====================================
// Send out to check the current version
ipcRenderer.send('checkVersion', true);

// ==============================================
// Check if the application is the latest version
ipcRenderer.on('oldVersion', (event, arg) => {
    $('#cur-version').html(arg.currentVersion);
    $('#latest-version').html(arg.latestVersion);

    $('.sb-old-version').addClass('in');
});