var fs = require('fs');
const path = require('path');
var readline = require('readline');
var { google } = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('../client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), uploadVideo);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
    });
}

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
///////////////////////////MY CODE//////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

//Get title and description data
const twitchDataPath = '../twitch-data';
const [firstTwitchDataPathFilename] = fs.readdirSync(twitchDataPath).filter(filename => filename.startsWith('_video'));
const firstTwitchDataPath = path.join(twitchDataPath, firstTwitchDataPathFilename);

const firstTwitchData = JSON.parse(fs.readFileSync(firstTwitchDataPath, { encoding: 'utf8' }));

//Get videos
const youtubeDataPath = '../youtube-data';
const [firstYoutubeDataPathFileName] = fs.readdirSync(youtubeDataPath).filter(filename => filename.startsWith('video'));
const firstYoutubeDataPath = path.join(youtubeDataPath, firstYoutubeDataPathFileName);
console.log(firstYoutubeDataPath);

const service = google.youtube('v3');
const uploadVideo = (auth) => {
    service.videos.insert(
        {
            auth: auth,
            part: 'snippet,contentDetails,status',
            resource: {
                // Video title and description
                snippet: {
                    title: firstTwitchData.title,
                    description: firstTwitchData.description
                },
                // I set to private for tests
                status: {
                    privacyStatus: 'public'
                }
            },
            media: {
                body: fs.createReadStream(firstYoutubeDataPath)
            }
        },
        (error, data) => {
            if (error) {
                return error;
            }
            console.log('https://www.youtube.com/watch?v=' + data.data.id);
            return data.data.id;
        }
    );
};

setTimeout(() => {
    fs.unlinkSync(firstTwitchDataPath);
    fs.unlinkSync(firstYoutubeDataPath);
}, 120000);
