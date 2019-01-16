const {ipcRenderer} = require('electron');

$(() => {
    // Request if the api key is valid
    ipcRenderer.send('requestApiValidation', true);

    // The returned state of the api key
    ipcRenderer.on('onRequestedApiValidation', (event, arg) => {
        if(arg == false) {
            $('body').append(`<div class="alert alert-danger apiError"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2>You have not set your API key yet. Make sure to set your API key <a href="./settings.html">here</a>.</div>`);
        }
    });

    $('#createLobby').on('click', () => {
        $('#createLobby').html('Create <i class="fas fa-spinner fa-spin"></i>');

        // Create a lobby with the filled in data
        ipcRenderer.send('createLobby', {
            'match-description': $('#matchDescription').val(),
            'match-url': $('#multiplayerLink').val(),
            'team-one-name': $('#teamOneName').val(),
            'team-two-name': $('#teamTwoName').val()
        });
    });

    // This will be called when the match has been created
    ipcRenderer.on('matchHasBeenCreated', function(event, arg) {
        $('#createLobbyAlert').css('display', 'block');
        $('#lobbyText').html(`The match has been succesfully created. <a href="./lobbyview.html?id=${arg}">Click here to go to the lobby</a>.`);
        $('#createLobby').html('Create');

        // Send a request to the server to retrieve all saved lobbies
        ipcRenderer.send(`requestSavedLobbies`, true);
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