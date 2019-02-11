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

        // Remove the message from the screen
        setTimeout(() => {
            $('#message').html('');
        }, 3000);
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

        // Remove the message from the screen
        setTimeout(() => {
            $('#message').html('');
        }, 3000);
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

        // Remove the message from the screen
        setTimeout(() => {
            $('#exportConfigFileMessage').addClass('no-show');
        }, 3000);
    });

    $('#clearCache').on('click', function() {
        // send a request to clear the cache
        ipcRenderer.send('clearCache', true);
    });

    // When the cache has been cleared
    ipcRenderer.on('clearedCache', (event, arg) => {
        $('#clearCacheMessage').removeClass('no-show');

        // Remove the message from the screen
        setTimeout(() => {
            $('#clearCacheMessage').addClass('no-show');
        }, 3000);
    });

    $('#removeApiKey').on('click', function() {
        // send a request to remove the api key
        ipcRenderer.send('removeApiKey', true);
    });

    // When the cache has been cleared
    ipcRenderer.on('removedApiKey', (event, arg) => {
        $('#removeApiKeyMessage').removeClass('no-show');

        // Remove the message from the screen
        setTimeout(() => {
            $('#removeApiKeyMessage').addClass('no-show');
        }, 3000);
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

        // Remove the message from the screen
        setTimeout(() => {
            $('#exportModifiersMessage').addClass('no-show');
        }, 3000);
    });
});