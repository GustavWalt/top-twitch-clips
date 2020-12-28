////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//////////////////////TWITCH API CONFIGURATION//////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

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

//Required packages
const fs = require('fs');
const axios = require("axios").default;
const logger = require('./logger');
const clientId = options.data.client_id;

//Function to fetch my access token
async function fetchAccessToken() {
  logger.info("Fetching the access token");
  const response = await axios.request(options);
  return response.data.access_token;
  logger.info("Successfully fetched access token");
}

//Getting the usernames of twitch top list in a object
function fetchTopTwitchUsers() {
  logger.info("Reading twitch users json file");
  const jsonData = JSON.parse(fs.readFileSync('/home/pi/top-twitch-clips/twitch-data/top-twitch-users.json', { encoding: 'utf8' }));
  return jsonData.topTwitchUsers;
  logger.info("Successfully read twitch users json file");
}

////////////////////////////////////////////////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
////////////////////////////////////////////////////////////////////////

//Function to fetch the twich user ID's
async function fetchTwitchUserId(loginName, accessToken, clientId) {
  logger.info("Axios request to the twitch API.");
  const response = await axios.get(
    `https://api.twitch.tv/helix/users?login=${loginName}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": clientId,
      },
    }
  );
  logger.info("Successfully connected to Twitch API.");
  const userId = response.data.data?.[0]?.id;
  if (!userId) {
    console.error(`Could not fetch userId for login name: ${loginName}`);
  }
  return userId;
}

////////////////////////////////////////////////////////////////////////
///////////////////////GET USERS TWITCH CLIPS///////////////////////////
///////////////////////GET USERS TWITCH CLIPS///////////////////////////
///////////////////////GET USERS TWITCH CLIPS///////////////////////////
////////////////////////////////////////////////////////////////////////

//Create date format
logger.info("Creating date and yesterday");
const date = new Date();
const today = date.toISOString();
date.setDate(date.getDate() - 1);
const yesterday = date.toISOString();

//Function to fetch the twich user clips
async function fetchTwitchUserClip(userId, accessToken, clientId) {
  logger.info("Axios get request to get clips");
  const response = await axios.get(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=1&started_at=${yesterday}&ended_at=${today}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": clientId,
      },
    }
  );
  logger.info("Successfully connected and got clips.");

  if (!response.data) throw new Error("No clips returned!");

  logger.info("Saving the object data");
  const clipInfo = response.data.data.map(({ thumbnail_url, title }) => ({
    clipTitle: title,
    clipMp4Url: `${thumbnail_url.replace(/-preview-\d+x\d+.\w+/, '')}.mp4`,
    clipThumbnail: thumbnail_url
  }));
  logger.info("Successfully saved the object data");

  return clipInfo;
}

////////////////////////////////////////////////////////////////////////
/////////////FUNCTIONS FOR GETTING THE THUMBNAIL / MP4//////////////////
/////////////FUNCTIONS FOR GETTING THE THUMBNAIL / MP4//////////////////
/////////////FUNCTIONS FOR GETTING THE THUMBNAIL / MP4//////////////////
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
////////////////////////////////////////////////////////////////////////

//Main function where I run everything.
async function main() {

  logger.info("Creaing array and accessToken");
  // TODO: get top twitch users array
  const topTwitchUsers = [];
  const accessToken = await fetchAccessToken();
  logger.info("Successfully created array and fetched accessToken");

  logger.info("Collecting userId's in array");
  // Now collect all userId requests in a array
  const userIdRequests = [];
  const userClipRequests = [];
  const userNames = fetchTopTwitchUsers();
  logger.info("Successfully fetched userId's");

  //Loop to get all the user ID's
  for (const loginName of userNames) {
    logger.info("Pushing the data in to an array");
    userIdRequests.push(fetchTwitchUserId(loginName, accessToken, clientId));
  }
  logger.info("Successfully pushed data in the array");

  // Now wait till all requests finished and you have an array of all user ids
  logger.info("Awaiting the userId's");
  const twitchUserIds = await Promise.all(userIdRequests);
  logger.info("Successfully fetched the userId's from the await");

  //Getting the requested data and pushing it into a object
  for (const userId of twitchUserIds) {
    logger.info("Getting requested data");
    userClipRequests.push(fetchTwitchUserClip(userId, accessToken, clientId));
  }
  logger.info("Successfully requested data and pushed it in the object");

  //Getting the object and creating a clipTitle object and getting the description
  logger.info("Getting userClipinfo, clipTitle and clipDescription using FS");
  const userClipInfoObject = await Promise.all(userClipRequests);
  var clipTitle = {};
  const clipDescription = (fs.readFileSync('/home/pi/top-twitch-clips/twitch-data/description.txt', { encoding: 'utf8' }));
  logger.info("Successfully got the userClipInfo, clipTitle and clipDescription data");

  //Saving the title in the object
  for (var i = 0; i < userClipInfoObject.length; i++) {
    logger.info("Saving titles in the object");
    if(!userClipInfoObject?.[i]?.[0]?.clipTitle){
        continue;
    }
    clipTitle[i] = { title: userClipInfoObject[i][0].clipTitle, description: clipDescription };
  }
  logger.info("Successfully saved titles in the object");

  //Saving the description and title to a json file
  logger.info("Saving description and title to json file");
  for (var i = 0; i < userClipInfoObject.length; i++) {
    logger.info("Writing file to file system");
    if(!clipTitle?.[i]){
        continue;
    }
    fs.writeFile('/home/pi/top-twitch-clips/twitch-data/_video' + [i] + '.json', JSON.stringify(clipTitle[i]), err => {
      if (err) {
        console.error(err)
        logger.info("Something went wrong fetching metadata");
        return
      } else {
        console.log("Fetching metadata");
        logger.info("Fetching metadata");
      }
    })
  }
  logger.info("Successfully saved all description and titles to json file");

  //Download the mp4
  logger.info("Downloading the MP4");
  for (var i = 0; i < userClipInfoObject.length; i++) {
    logger.info("Axios request to get MP4's");
    if(!userClipInfoObject?.[i]?.[0]?.clipMp4Url){
        continue;
    }
    const response = await axios.get(userClipInfoObject[i][0].clipMp4Url, { responseType: "stream" });
    logger.info("Create write stream to the file system");
    response.data.pipe(fs.createWriteStream("/home/pi/top-twitch-clips/youtube-data/video" + i + ".mp4"));
    console.log("Fetching twitch clips");
  }
  logger.info("Successfully downloaded the MP4's");

  //Download the thumbnail
  logger.info("Download the thumbnail");
  for (var i = 0; i < userClipInfoObject.length; i++) {
    logger.info("Axios request to get thumbnail");
    if(!userClipInfoObject?.[i]?.[0]?.clipThumbnail){
        continue;
    }
    const response = await axios.get(userClipInfoObject[i][0].clipThumbnail, { responseType: "stream" });
    logger.info("Create write stream to the file system");
    response.data.pipe(fs.createWriteStream("/home/pi/top-twitch-clips/youtube-data/thumbnail" + i + ".jpg"));
  }
  logger.info("Successfuly downloaded the thumbnails");
  
  //Exit the process
  logger.info("Twitch.js successfully ran");
}

main();