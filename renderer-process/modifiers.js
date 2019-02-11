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

    // Request the modifiers from the cache
    ipcRenderer.send('requestAllModifiers', true);

    ipcRenderer.on('requestedModifiers', (event, arg) => {
        for(let beatmap in arg) {
            const currentModifier = arg[beatmap];

            $('#allModifiers').append(`<tr id=${currentModifier.beatmap_id}>
                                        <td>${currentModifier.beatmap_name}</td>
                                        <td>
                                            <input id="beatmap_${currentModifier.beatmap_id}" type=text class=form-control placeholder="Beatmap url" value="${currentModifier.beatmap_id}" />
                                        </td>

                                        <td>
                                            <input id="modifier_${currentModifier.beatmap_id}" type=text class=form-control placeholder="Modifier" value="${currentModifier.modifier}" />
                                        </td>

                                        <td>
                                            <button type=button id="save_${currentModifier.beatmap_id}" class="btn btn-sb-menu btn-xs" title="Save"><i class="far fa-save"></i></button>
                                            <button type=button id="remove_${currentModifier.beatmap_id}" class="btn btn-sb-menu btn-xs" title="Remove"><i class="far fa-trash-alt"></i></button>
                                            <span class=red-text id=error_${currentModifier.beatmap_id}></span>
                                            <span class=green-text id=message_${currentModifier.beatmap_id}></span>
                                        </td>
                                    </tr>`);
        }
    });

    $('#createNewModifier').on('click', function() {
        const randomToken = generateToken(10);

        $('#allModifiers').append(`<tr id=${randomToken}>
                                        <td></td>
                                        <td>
                                            <input id="beatmap_${randomToken}" type=text class=form-control placeholder="Beatmap url" />
                                        </td>

                                        <td>
                                            <input id="modifier_${randomToken}" type=text class=form-control placeholder="Modifier" />
                                        </td>

                                        <td>
                                            <button type=button id="save_${randomToken}" class="btn btn-sb-menu btn-xs" title="Save"><i class="far fa-save"></i></button>
                                            <button type=button id="remove_${randomToken}" class="btn btn-sb-menu btn-xs" title="Remove"><i class="far fa-trash-alt"></i></button>
                                            <span class=red-text id=error_${randomToken}>This modifier has not been saved yet.</span>
                                            <span class=green-text id=message_${randomToken}></span>
                                        </td>
                                    </tr>`);
    });

    ipcRenderer.on('deletedModifier', (event, arg) => {
        $(`#${arg}`).remove();
    });

    $('#importModifiers').on('click', function() {
        // ======================================
        // Send out a request to import modifiers
        ipcRenderer.send('importModifiers', true);
    });
});

$('#allModifiers').on('click', '[id^=save_]', function() {
    const thisId = this.id.replace('save_', '');
    const beatmapUrl = $(`#beatmap_${thisId}`).val();
    const modifier  = $(`#modifier_${thisId}`).val();

    if(!isValidBeatmapUrl(beatmapUrl)) {
        $(`#error_${thisId}`).html('Invalid beatmap url');
    }
    else if(!$.isNumeric(modifier)) {
        $(`#error_${thisId}`).html('Invalid modifier');
    }
    else {
        $(`#error_${thisId}`).html('');
        
        // Create a new modifier
        ipcRenderer.send('createBeatmapModifier', {
            'beatmapUrl': beatmapUrl,
            'modifier': modifier
        });

        $(`#message_${thisId}`).html('Saved!');
    }
});

$('#allModifiers').on('click', '[id^=remove_]', function() {
    const thisId = this.id.replace('remove_', '');

    // Delete a modifier
    ipcRenderer.send('deleteModifier', thisId);
});