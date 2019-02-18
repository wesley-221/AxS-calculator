const {ipcRenderer} = require('electron');

$(() => {
    // ==============================================
    // Check if the application is the latest version
    ipcRenderer.on('oldVersion', (event, arg) => {
        $('#cur-version').html(arg.currentVersion);
        $('#latest-version').html(arg.latestVersion);

        $('.sb-old-version').addClass('in');
    });

    ipcRenderer.on('newVersion', (event, arg) => {
        $('#cur-version').html(arg.currentVersion);
        $('#latest-version').html(arg.latestVersion);

        $('#download-button').remove();
        $('#version-description').html('You are currently on a Beta build. Some features may not work as expected');

        $('.sb-old-version').addClass('in');
    });

    // =======================================
    // Check if the filled in API key is valid
    ipcRenderer.on('onRequestedApiValidation', (event, arg) => {
        if(arg == false) {
            $('body').append(`<div class="alert alert-danger apiError"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2>You have not set your API key yet. Make sure to set your API key <a href="./settings.html">here</a>.</div>`);
        }
    });
});