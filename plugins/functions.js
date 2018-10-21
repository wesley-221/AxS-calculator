module.exports = {
    createToken: function(length = 5) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';

        for(let i = 0; i < length; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }

        return token;
    },
    getMultiplayerIdFromUrl: function(url) {
        const regularExpression = new RegExp(/https:\/\/osu\.ppy\.sh\/community\/matches\/([0-9]+)/).exec(url);

        if(regularExpression) {
            return regularExpression[1];
        }

        return false;
    }
};