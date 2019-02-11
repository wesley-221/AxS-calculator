const {app, ipcMain} = require('electron');

const Octakit = require('@octokit/rest');
const octakit = new Octakit();

// ======================================
// This is called when accessing any page
ipcMain.on('checkVersion', (event, arg) => {
    // =====================================================================
    // Check if the version is the latest version, if not send out a warning
    octakit.repos.getContents({
        'owner': 'wesleyalkemade',
        'repo': 'AxS-calculator',
        'path': 'package.json'
    }).then(result => {
        // console.log(result.data.content);
        // let buffer = Buffer.alloc(null, result.data.content, 'base64');
        // console.log(buffer.toString('ascii'));

        console.log('test');
    }).catch(error => {
        console.log(error);
    });
});