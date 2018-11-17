document.body.addEventListener('click', event => {
    if(event.target.dataset.section) {
        handleSectionTrigger(event);
    }
});

function handleSectionTrigger (event) {
    hideAllSectionsAndDeselectButtons();
  
    // Highlight clicked button and show view
    event.target.classList.add('in');
  
    // Display the current section
    const sectionId = `${event.target.dataset.section}-section`;
    $(`#${sectionId}`).addClass('in');
}

function hideAllSectionsAndDeselectButtons () {
    const sections = $(`.sb-nav-column.in`);
    
    Array.prototype.forEach.call(sections, section => {
        section.classList.remove('in');
    });

    const allSections = $(`.section`);

    Array.prototype.forEach.call(allSections, section => {
        section.classList.remove('in');
    });
}

const links = document.querySelectorAll('link[rel="import"]')

// Import and add each page to the DOM
Array.prototype.forEach.call(links, link => {
    let template = link.import.querySelector('.task-template');
    let clone = document.importNode(template.content, true);

    document.querySelector('.mainContent').appendChild(clone);
})


function getUrlParamters() {
    let vars = {};

    const parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });

    return vars;
}

function addDot(nStr, splitter = ' ') {
    nStr += '';
    const x = nStr.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;

    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + splitter + '$2');
    }

    return x1 + x2;
}

function generateToken(length = 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';

    for(let i = 0; i < length; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }

    return token;
}

function isValidBeatmapUrl(url) {
    const beatmapValidOld = new RegExp(/https:\/\/osu\.ppy\.sh\/(b|s)\/([0-9]+)/).exec(url);
    const beatmapValidNew = new RegExp(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[a-zA-Z]+\/([0-9]+)/).exec(url);

    if(beatmapValidOld) {
        if(beatmapValidOld[1] === 's') {
            return false;
        }
        else if(beatmapValidOld[1] === 'b') {
            return beatmapValidOld[2];
        }
    }
    else if(beatmapValidNew) {
        if(beatmapValidNew) {
            return beatmapValidNew[1];
        }
        else {
            return false;
        }
    }
    else if($.isNumeric(url)) {
        return url;
    }
}

$('body').on('click', '.apiError', function() {
    $(this).remove();
});

$('body').on('click', '.sb-old-version a', (e) => {
    e.preventDefault();
    require("electron").shell.openExternal(e.target.href);
});