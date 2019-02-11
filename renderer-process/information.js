const {ipcRenderer} = require('electron');

$(() => {
    // ==============================================
    // Check if the application is the latest version
    ipcRenderer.on('oldVersion', (event, arg) => {
        $('#cur-version').html(arg.currentVersion);
        $('#latest-version').html(arg.latestVersion);

        $('.sb-old-version').addClass('in');
    });
});