const fs = require('fs');
var axios = require("axios").default;

//Getting the usernames of twitch top list in a object
const topTwitchUsers = JSON.parse(fs.readFileSync('./top-twitch-users.json', { encoding: 'utf8' }));

//Options to get the OAuth2 token
var options = {
    method: 'POST',
    url: 'https://id.twitch.tv/oauth2/token',
    headers: { 'content-type': 'application/json' },
    data: {
        grant_type: 'client_credentials',
        client_id: 'l67985j6d11n7cqyu0raf9b3w2el9c',
        client_secret: 'maxdxjg7xk6ypdsh8int1kykw5p46n',
    },
};

//Request to get the access_token
axios.request(options).then(function (response) {
    //Get request to get users ID
    axios.get('https://api.twitch.tv/helix/users?id=44322889', {
        headers: {
            Authorization: 'Bearer ' + response.data.access_token,
            "Client-ID": options.data.client_id
        }
    })
        .then((res) => {
            console.log(res.data)
        })
        .catch((error) => {
            console.error(error)
        })
}).catch(function (error) {
    console.error(error);
});