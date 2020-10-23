//Using cheerio NPM package and the cloudflare-scraper NPM package.
const cloudflareScraper = require('cloudflare-scraper');
const cheerio = require('cheerio');
const fs = require('fs');
 
//Async function to scrap socialblade for the top 100 followed twitch users.
(async () => {
  try {
    const response = await cloudflareScraper.get('https://socialblade.com/twitch/top/100');
    const $ = cheerio.load(response);

    //Create a array (cheerio uses jQuery, same docs) and import all the user names into the array and filter it.
    const topTwitchUsers = [];
    $('a[href^="/twitch/user/"]').each((index, element) => {
        topTwitchUsers.push($(element).attr('href').replace('/twitch/user/', ''));
    });

    //Save the data in a JSON file
    fs.writeFileSync('./top-twitch-users.json', JSON.stringify({ topTwitchUsers }));

  } catch (error) {
    console.log(error);
  }
})();