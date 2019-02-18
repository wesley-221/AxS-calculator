const {app, ipcMain} = require('electron');
const fnc = require('../plugins/functions.js');
const rp = require('request-promise');

const Store = require('electron-store');
const store = new Store();

// ===========================================
// This will be called when you create a lobby
// TODO: Make it so that this doesn't freeze the render process
ipcMain.on('createLobby', (event, arg) => {
    const lobbyToken = fnc.createToken(10);

    // Store the settings
    store.set(`lobby.${lobbyToken}.data`, {
        description:        arg['match-description'],
        multiplayerLink:    arg['match-url'],
        teamOneName:        arg['team-one-name'],
        teamTwoName:        arg['team-two-name']
    });

    const apiKey        = store.get('api-key.key');
    let cache           = store.get('cache');
    const multiplayerId = fnc.getMultiplayerIdFromUrl(arg['match-url']);

    rp(`https://osu.ppy.sh/api/get_match?k=${apiKey}&mp=${multiplayerId}`).then(multiplayerLobby => {
        multiplayerLobby = JSON.parse(multiplayerLobby);

        // Loop through all the games
        for(let game in multiplayerLobby.games) {
            const currentGame = multiplayerLobby.games[game];
            let gameScore = {};
            let currentModifier;

            if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
            }
            else {
                currentModifier = 0;
            }

            // Loop through all the scores of the current map
            for(let score in currentGame.scores) {
                const currentScore = currentGame.scores[score];

                // Check if the user has been cached, if not cache it
                if(!cache.users.hasOwnProperty(currentScore.user_id)) {
                    rp(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=${currentScore.user_id}`).then(user => {
                        user = JSON.parse(user);

                        // The user exists
                        if(user.length > 0) {
                            cache.users[currentScore.user_id] = user[0].username;
                            store.set(`cache.users.${currentScore.user_id}`, user[0].username);
                        }
                        // The user doesn't exist, most likely restricted
                        else {
                            cache.users[currentScore.user_id] = 'Unknown user (possibly restricted)';
                            store.set(`cache.users.${currentScore.user_id}`, 'Unknown user (possibly restricted)');
                        }
                    });
                }

                // Accuracy players
                if(['0','3'].indexOf(currentScore.slot) > -1) {
                    gameScore.user = currentScore.user_id;
                    gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateAccuracyPlayerScore(currentScore.score));
                    gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                    gameScore.passed = currentScore.pass;

                    store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                }
                // Score players
                else if(['1','2','4','5'].indexOf(currentScore.slot) > -1) {
                    gameScore.user = currentScore.user_id;
                    gameScore.score = (currentScore.pass == 0 ? 0 : fnc.calculateScorePlayerScore(currentScore.score, fnc.getAccuracyOfScore(currentScore), currentModifier));
                    gameScore.accuracy = (currentScore.pass == 0 ? 0 : fnc.getAccuracyOfScore(currentScore));
                    gameScore.passed = currentScore.pass;

                    store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.${currentScore.slot}`, gameScore);
                }

                store.set(`lobby.${lobbyToken}.multiplayerData.${currentGame.game_id}.beatmap_id`, currentGame.beatmap_id);
            }

            // Check if the beatmap has been cached, if not cache it
            if(!cache.beatmaps.hasOwnProperty(currentGame.beatmap_id)) {
                rp(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${currentGame.beatmap_id}&m=2&a=1`).then(beatmap => {
                    beatmap = JSON.parse(beatmap);

                    store.set(`cache.beatmaps.${currentGame.beatmap_id}`, {
                        name: `${beatmap[0].artist} - ${beatmap[0].title} [${beatmap[0].version}]`,
                        beatmapset_id: beatmap[0].beatmapset_id
                    });
                });
            }
        }
    }).finally(async () => {
        const multiplayerGames = new Promise((resolve) => {
            resolve(store.get(`lobby.${lobbyToken}.multiplayerData`));
        });

        await multiplayerGames.then(async multiplayerGamesPromise => {
            for(let game in multiplayerGamesPromise) {
                let currentGame = multiplayerGamesPromise[game];
                let currentModifier;

                // ===================
                // Handle the modifier
                if(cache.modifiers.hasOwnProperty(currentGame.beatmap_id)) {
                    currentModifier = cache.modifiers[currentGame.beatmap_id].modifier;
                }
                else {
                    currentModifier = 0;
                }

                // ================================================
                // Set undefined scores to 0 score and 85% accuracy
                for(let i = 0; i < 6; i ++) {
                    if(currentGame[i] == undefined) {
                        currentGame[i] = {"user": "-1", "score": "0", "accuracy": "85.00", "passed": "0"};

                        store.set(`lobby.${lobbyToken}.multiplayerData.${game}.${i}`, currentGame[i]);
                    }
                }

                const finalTeamOneScore = parseFloat(fnc.calculateTeamScore(currentGame[0].score, currentGame[1].score, currentGame[2].score, currentGame[0].accuracy, currentModifier));
                const finalTeamTwoScore = parseFloat(fnc.calculateTeamScore(currentGame[3].score, currentGame[4].score, currentGame[5].score, currentGame[3].accuracy, currentModifier));

                store.set(`lobby.${lobbyToken}.multiplayerData.${game}.team_one_score`, finalTeamOneScore);
                store.set(`lobby.${lobbyToken}.multiplayerData.${game}.team_two_score`, finalTeamTwoScore);
            }
        });

        event.sender.send(`matchHasBeenCreated`, lobbyToken);
    });
});