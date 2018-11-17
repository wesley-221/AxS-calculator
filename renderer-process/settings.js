const {ipcRenderer} = require('electron');

$(() => {
    $('#saveButton').on('click', function() {
        $('#saveButton').html('Save <i class="fas fa-spinner fa-spin"></i>');
        ipcRenderer.send('saveAPIKey', $('#apiKey').val());
    });

    // This is called when the data has been saved
    ipcRenderer.on('savedData', (event, arg) => {
        $('#saveButton').html('Save');
        $('#message').html(`<div class="alert alert-success col-7"><h2><i class="fas fa-check"></i> Success!</h2>Succesfully saved your API key.</div>`);
    });

    // Request the api key
    ipcRenderer.send('requestAPIKey', true);

    // The api key that you requested
    ipcRenderer.on('requestedAPIKey', (event, apiKey) => {
        $('#apiKey').val(apiKey);
    });

    // When an error is returned
    ipcRenderer.on('errorMessage', (event, errorMessage) => {
        $('#saveButton').html('Save');
        $('#message').html(`<div class="alert alert-danger col-7"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2> ${errorMessage}</div>`);
    });

    $('#exportConfigFile').on('click', function() {
        // Send a request to export the config file
        ipcRenderer.send('exportConfigFile', true);
    });

    ipcRenderer.on('exportedConfigFile', (event, arg) => {
        if(arg.hasOwnProperty('success')) {
            $('#exportConfigFileMessage').html(arg.success);
            $('#exportConfigFileMessage').addClass('alert-success');
            $('#exportConfigFileMessage').removeClass('alert-danger');
            $('#exportConfigFileMessage').removeClass('no-show');
        }
        else {
            $('#exportConfigFileMessage').html(arg.error);
            $('#exportConfigFileMessage').addClass('alert-danger');
            $('#exportConfigFileMessage').removeClass('alert-success');
            $('#exportConfigFileMessage').removeClass('no-show');
        }
    });

    $('#clearCache').on('click', function() {
        // send a request to clear the cache
        ipcRenderer.send('clearCache', true);
    });

    // When the cache has been cleared
    ipcRenderer.on('clearedCache', (event, arg) => {
        $('#clearCacheMessage').removeClass('no-show');
    });

    $('#removeApiKey').on('click', function() {
        // send a request to remove the api key
        ipcRenderer.send('removeApiKey', true);
    });

    // When the cache has been cleared
    ipcRenderer.on('removedApiKey', (event, arg) => {
        $('#removeApiKeyMessage').removeClass('no-show');
    });

    $('#exportModifiers').on('click', function() {
        // send a request to export the modifiers
        ipcRenderer.send('exportModifiers', true);
    });

    // When the modifiers have been exported
    ipcRenderer.on('exportedModifiers', (event, arg) => {
        if(arg.hasOwnProperty('success')) {
            $('#exportModifiersMessage').html(arg.success);
            $('#exportModifiersMessage').addClass('alert-success');
            $('#exportModifiersMessage').removeClass('alert-danger');
            $('#exportModifiersMessage').removeClass('no-show');
        }
        else {
            $('#exportModifiersMessage').html(arg.error);
            $('#exportModifiersMessage').addClass('alert-danger');
            $('#exportModifiersMessage').removeClass('alert-success');
            $('#exportModifiersMessage').removeClass('no-show');
        }
    });

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
});