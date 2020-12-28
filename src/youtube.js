var fs = require('fs');
const path = require('path');
const logger = require('./logger');
var readline = require('readline');
var { google } = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
logger.info("Getting path / directions in the fs");
var SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
var TOKEN_DIR = '/home/pi/top-twitch-clips/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';
logger.info("Successfully got path / directions");

// Load client secrets from a local file.
logger.info("Loading client secrets from local file");
fs.readFile('/home/pi/top-twitch-clips/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        logger.info("Error loading client secret file");
        return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    logger.info("Authorize the client with credentials, call the YouTube API");
    authorize(JSON.parse(content), uploadVideo);
});
logger.info("Successfully loaded client secrets");

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    logger.info("Getting the client secret, id etc from credentials");
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    logger.info("Successfully got client secret, id etc from credentials");

    // Check if we have previously stored a token.
    logger.info("Check if we have previously stored a token");
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            logger.info("You have to get a new token!");
            getNewToken(oauth2Client, callback);
        } else {
            logger.info("You had previously stored a token, continuing.");
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
    logger.info("NEED A NEW TOKEN - MANUAL INPUT REQUIRED");
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
    logger.info("Storing token to disk to be used in later program executions.");
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
    logger.info("Successfully stored token to disk");
}

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
///////////////////////////MY CODE//////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

//Get title and description data
logger.info("Getting title and description data using file system");
const twitchDataPath = '/home/pi/top-twitch-clips/twitch-data';
const [firstTwitchDataPathFilename] = fs.readdirSync(twitchDataPath).filter(filename => filename.startsWith('_video'));
const firstTwitchDataPath = path.join(twitchDataPath, firstTwitchDataPathFilename);
logger.info("Successfully got title and description data");

logger.info("Parsing the twitch data using file system");
const firstTwitchData = JSON.parse(fs.readFileSync(firstTwitchDataPath, { encoding: 'utf8' }));
logger.info("Successfully parsed the twitch data");

//Get videos
logger.info("Get videos from file system");
const youtubeDataPath = '/home/pi/top-twitch-clips/youtube-data';
const [firstYoutubeDataPathFileName] = fs.readdirSync(youtubeDataPath).filter(filename => filename.startsWith('video'));
const firstYoutubeDataPath = path.join(youtubeDataPath, firstYoutubeDataPathFileName);
console.log(firstYoutubeDataPath);
logger.info("Successfully got the videos from file system");

logger.info("Uploading video...");
const service = google.youtube('v3');
const uploadVideo = (auth) => {
    logger.info("Inserting metadata");
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
                logger.debug('Something went wrong', { error });
                return error;
            }
            logger.info("Successfully created youtube video.");
            console.log('https://www.youtube.com/watch?v=' + data.data.id);
            return data.data.id;
        }
    );
};
logger.info("Successfully uploaded video");

logger.info("Timeout for removing the clips.");
setTimeout(() => {
    fs.unlinkSync(firstTwitchDataPath);
    fs.unlinkSync(firstYoutubeDataPath);
}, 300000);
logger.info("Successfully removed the clips");