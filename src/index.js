const fs = require('fs');

const topTwitchUsers = JSON.parse(fs.readFileSync('./top-twitch-users.json', { encoding: 'utf8' }));
console.log(topTwitchUsers);