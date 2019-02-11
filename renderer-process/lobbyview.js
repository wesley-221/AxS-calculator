const {ipcRenderer} = require('electron');
const settings = require('electron-settings');

$(() => {
    // Request if the api key is valid
    ipcRenderer.send('requestApiValidation', true);

    // The returned state of the api key
    ipcRenderer.on('onRequestedApiValidation', (event, arg) => {
        if(arg == false) {
            $('body').append(`<div class="alert alert-danger apiError"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2>You have not set your API key yet. Make sure to set your API key <a href="./settings.html">here</a>.</div>`);
        }
    });

    // =================================================
    // This will be called after requestMultiplayerLobby
    ipcRenderer.on('requestedLobby', (event, arg) => {
        // Get the score of the lobby
        let teamOneScore = 0,
            teamTwoScore = 0;

        for(let map in arg.maps) {
            const currentMap = arg.maps[map];

            if(currentMap.team_one_score > currentMap.team_two_score) {
                teamOneScore ++;
            }
            else {
                teamTwoScore ++;
            }
        }

        // Reset the elements
        $('.matchHeader').html('');
        $('.allMaps').html('');

        $('.matchHeader').append(`<h2>${arg.lobby.data.description}</h2>
                                    Multiplayer link: <a href="${arg.lobby.data.multiplayerLink}">${arg.lobby.data.multiplayerLink}</a><br />

                                    <span id="scoreString"><span class=red-text>Team ${arg.lobby.data.teamOneName}</span> score : <span class=${(teamOneScore > teamTwoScore) ? 'teamWin' : 'teamLoss'}>${teamOneScore}</span> | <span class=${(teamOneScore > teamTwoScore) ? 'teamLoss' : 'teamWin'}>${teamTwoScore}</span> : score <span class=blue-text>Team ${arg.lobby.data.teamTwoName}</span></span>
                                    <button id=getMultiplayerData type=button class="btn btn-info float-right" data-lobbyid="${arg.lobbyId}">Retrieve multiplayer data</button>
                                    <hr />`);

        for(let map in arg.maps) {
            const currentMap = arg.maps[map];

            const teamOneColour = (currentMap.team_one_score > currentMap.team_two_score) ? 'teamWin' : 'teamLoss';
            const teamTwoColour = (currentMap.team_two_score > currentMap.team_one_score) ? 'teamWin' : 'teamLoss';

            const winMessage = (currentMap.team_one_score > currentMap.team_two_score) ? `<span class=red-text>Team ${arg.lobby.data.teamOneName}</span> has won. <span class=red-text>Team ${arg.lobby.data.teamOneName}</span> score: ${addDot(currentMap.team_one_score)} | <span class=blue-text>Team ${arg.lobby.data.teamTwoName}</span> score: ${addDot(currentMap.team_two_score)} | Score difference: ${addDot(currentMap.team_one_score - currentMap.team_two_score)}` : `<span class=blue-text>Team ${arg.lobby.data.teamTwoName}</span> has won. <span class=red-text>Team ${arg.lobby.data.teamOneName}</span> score: ${addDot(currentMap.team_one_score)} | <span class=blue-text>Team ${arg.lobby.data.teamTwoName}</span> score: ${addDot(currentMap.team_two_score)} | Score difference: ${addDot(currentMap.team_two_score - currentMap.team_one_score)}`;
            const copyMessage = (currentMap.team_one_score > currentMap.team_two_score) ? `Team ${arg.lobby.data.teamOneName} has won. Team ${arg.lobby.data.teamOneName} score: ${addDot(currentMap.team_one_score)} | Team ${arg.lobby.data.teamTwoName} score: ${addDot(currentMap.team_two_score)} | Score difference: ${addDot(currentMap.team_one_score - currentMap.team_two_score)}` : `Team ${arg.lobby.data.teamTwoName} has won. Team ${arg.lobby.data.teamOneName} score: ${addDot(currentMap.team_one_score)} | Team ${arg.lobby.data.teamTwoName} score: ${addDot(currentMap.team_two_score)} | Score difference: ${addDot(currentMap.team_two_score - currentMap.team_one_score)}`;

            const randomToken = generateToken(10);

            $('.allMaps').append(`<div class=multiMatch>
                                    <div class=mapPicture style='background-image: url("https://b.ppy.sh/thumb/${arg.cache.beatmaps[currentMap.beatmap_id].beatmapset_id}.jpg");'></div>

                                    <div class=mapContent>
                                        <div class=mapTitle>
                                            <h4>${arg.cache.beatmaps[currentMap.beatmap_id].name}</h4>
                                        </div>

                                        <div class=mapModifier>
                                            ${(arg.cache.modifiers[currentMap.beatmap_id] == undefined) ? '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> There was no modifier set for this map. <a href="./modifiers.html">Make sure to set a modifier so you get the accurate score.</a></div>' : `<h6>Beatmap modifier: ${arg.cache.modifiers[currentMap.beatmap_id].modifier}</h6>`}
                                        </div>

                                        <hr />

                                        <div class=mapScore>
                                            <h5>Team ${arg.lobby.data.teamOneName}</h5>
                                            <table>
                                                <tr>
                                                    <td><b>Accuracy player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[0].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[0].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[0].score).toFixed())} (${currentMap[0].accuracy}%)</td>
                                                </tr>

                                                <tr>
                                                    <td><b>Score player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[1].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[1].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[1].score).toFixed())} (${currentMap[1].accuracy}%)</td>
                                                </tr>

                                                <tr>
                                                    <td><b>Score player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[2].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[2].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[2].score).toFixed())} (${currentMap[2].accuracy}%)</td>
                                                </tr>
                                            </table>
                                            
                                            <hr />

                                            <h5>Team ${arg.lobby.data.teamTwoName}</h5>
                                            <table>
                                                <tr>
                                                    <td><b>Accuracy player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[3].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[3].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[3].score).toFixed())} (${currentMap[3].accuracy}%)</td>
                                                </tr>

                                                <tr>
                                                    <td><b>Score player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[4].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[4].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[4].score).toFixed())} (${currentMap[4].accuracy}%)</td>
                                                </tr>

                                                <tr>
                                                    <td><b>Score player</b></td>
                                                    <td>&emsp;</td>
                                                    <td>${(arg.cache.users[currentMap[5].user] == undefined) ? 'Not connected' : arg.cache.users[currentMap[5].user]}</td>
                                                    <td>&emsp;</td>
                                                    <td>${addDot(parseFloat(currentMap[5].score).toFixed())} (${currentMap[5].accuracy}%)</td>
                                                </tr>
                                            </table>

                                            <hr />

                                            <div class=red-text>Team ${arg.lobby.data.teamOneName} score: ${addDot(currentMap.team_one_score)}</div>
                                            <div class=blue-text>Team ${arg.lobby.data.teamTwoName} score: ${addDot(currentMap.team_two_score)}</div>

                                            <br />

                                            ${winMessage}
                                        </div>
                                    </div>

                                    <div class=mapButtons>
                                        <div id="copyresult_${randomToken}" class="green-text"></div>
                                        <button id="copy_${randomToken}" data-${randomToken}="${copyMessage}" type=button class="btn btn-primary">Copy result</button>
                                    </div>
                                </div>`);
        }
    });

    $('.matchHeader').on('click', '#getMultiplayerData', function() {
        $('#getMultiplayerData').html('Retrieve multiplayer data <i class="fas fa-spinner fa-spin"></i>');

        $('.matchHeader').append('<div id="scoresUpdatedAlert"></div>');

        // Request to get new multiplayerdata
        ipcRenderer.send('retrieveMultiplayerData', $(this).data('lobbyid'));
    });
});

$('body').on('click', '[id^=copy_]', function() {
    const thisId = this.id.replace('copy_', '');
    const copyMessage = $(this).attr(`data-${thisId}`);

    let textArea = document.createElement("textarea");
    textArea.value = copyMessage;
    document.body.appendChild(textArea);

    textArea.select();
    document.execCommand('copy');

    document.body.removeChild(textArea);

    $(`#copyresult_${thisId}`).addClass('in');
    $(`#copyresult_${thisId}`).html('Succesfully copied the result to your clipboard!');

    setTimeout(function() {
        $(`#copyresult_${thisId}`).removeClass('in');
    }, 3000);
});

// Open urls in the actual browser and not within the application
$('body').on('click', '.matchHeader a', (e) => {
    e.preventDefault();
    require("electron").shell.openExternal(e.target.href);
});