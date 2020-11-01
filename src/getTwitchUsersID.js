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
var axios = require("axios").default;
const clientId = options.data.client_id;

//Function to fetch my access token
async function fetchAccessToken() {
  const response = await axios.request(options);
  return response.data.access_token;
}

//Getting the usernames of twitch top list in a object
function fetchTopTwitchUsers(){
    const jsonData = JSON.parse(fs.readFileSync('../top-twitch-users.json', { encoding: 'utf8' }));
    return jsonData.topTwitchUsers;
}

////////////////////////////////////////////////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
//////////////////////////USER ID'S CONFIG//////////////////////////////
////////////////////////////////////////////////////////////////////////

//Function to fetch the twich user ID's
async function fetchTwitchUserId(loginName, accessToken, clientId) {
  const response = await axios.get(
    `https://api.twitch.tv/helix/users?login=${loginName}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": clientId,
      },
    }
  );
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
const date = new Date();
const today = date.toISOString();
date.setDate(date.getDate() - 1);
const yesterday = date.toISOString();

//Function to fetch the twich user clips
async function fetchTwitchUserClip(userId, accessToken, clientId) {
  const response = await axios.get(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=1&started_at=${yesterday}&ended_at=${today}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": clientId,
      },
    }
  );

  if(!response.data) throw new Error("No clips returned!");

  const clipInfo = response.data.data.map(({ thumbnail_url, title }) => ({
    clipTitle: title,
    clipMp4Url: `${thumbnail_url.replace(/-preview-\d+x\d+.\w+/, '')}.mp4`,
    clipThumbnail: thumbnail_url

  }));

  return clipInfo;
}

////////////////////////////////////////////////////////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
//////////////////MAIN FUNCTION WHER EIT ALL RUNS///////////////////////
////////////////////////////////////////////////////////////////////////

//Main function where I run everything.
async function main() {

  // TODO: get top twitch users array
  const topTwitchUsers = [];
  const accessToken = await fetchAccessToken();

  // Now collect all userId requests in a array
  const userIdRequests = [];
  const userClipRequests= [];
  const userNames = fetchTopTwitchUsers();

  //Loop to get all the user ID's
  for (const loginName of userNames) {
    userIdRequests.push(fetchTwitchUserId(loginName, accessToken, clientId));
  }

  // Now wait till all requests finished and you have an array of all user ids
  const twitchUserIds = await Promise.all(userIdRequests);

  //Getting the requested data and pushing it into a object
  for (const userId of twitchUserIds){
    userClipRequests.push(fetchTwitchUserClip(userId, accessToken, clientId));
  }

  //Getting the object and logging it.
  const userClipInfoObject = await Promise.all(userClipRequests);
  console.log(userClipInfoObject);
}

main();