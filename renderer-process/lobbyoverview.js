const {ipcRenderer} = require('electron');
const settings = require('electron-settings');

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

$(() => {
    // Request if the api key is valid
    ipcRenderer.send('requestApiValidation', true);

    // The returned state of the api key
    ipcRenderer.on('onRequestedApiValidation', (event, arg) => {
        if(arg == false) {
            $('body').append(`<div class="alert alert-danger apiError"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2>You have not set your API key yet. Make sure to set your API key <a href="./settings.html">here</a>.</div>`);
        }
    });

    // Send a request to the server to retrieve all saved lobbies
    ipcRenderer.send(`requestSavedLobbies`, true);
    
    // This will be called after the requestSavedLobbies call, it contains all the saved lobbies
    ipcRenderer.on('requestedLobbies', (event, arg) => {
        $('.allLobbies').html('');

        // Loop through the lobbies
        for(const lobbyId in arg) {
            const currentLobby = arg[lobbyId].data;

            $('.allLobbies').append(`<div id="${lobbyId}" class=multiplayerLobby data-section="lobby-view" data-lobbyid="${lobbyId}">
                                        <div class="body" data-section="lobby-view">
                                            <div class="row" data-section="lobby-view">
                                                <div class="col-11" data-section="lobby-view">
                                                    <span class="multiplayerId" data-section="lobby-view"><h1 data-section="lobby-view">${currentLobby.description}</h1></span>
                                                    <span class="multiplayerDesc" data-section="lobby-view">${currentLobby.teamOneName} vs ${currentLobby.teamTwoName}</span>
                                                </div>

                                                <div class="col-1" data-section="lobby-view">
                                                    <div class="multiplayerClose">
                                                        <button id="delete_${lobbyId}" type=button class="btn btn-danger">Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`);
        }
    });

    // When a lobby is deleted
    ipcRenderer.on('deletedLobby', (event, arg) => {
        $(`#${arg}`).remove();
    });

    // When you click on a multiplayer lobby block
    $('.mainContent').on('click', '.multiplayerLobby', function(e) {
        if(e.target.id.startsWith('delete_')) {
            if(confirm('Are you sure you want to delete this lobby?')) {
                const thisId = e.target.id.replace('delete_', '');
                
                // Delete a specific lobby
                ipcRenderer.send('deleteLobby', thisId);
            }
        }
        else {
            // Request the lobby 
            ipcRenderer.send('requestMultiplayerLobby', $(this).data('lobbyid'));
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