const craigslist = require('node-craigslist');
const request = require('request');
const googleApiKey = 'AIzaSyAd5wkdM3Bec-tvhXDNjYU6WBW2XJjOkKk';

function getDistanceInMinutes(ori, des) {
  return new Promise((resolve, reject) => {
    const options = {
      url: 'https://maps.googleapis.com/maps/api/directions/json',
      qs: {
        origin: ori,
        destination: des,
        avoid: 'highways',
        departure_time: 1506340800,
        key: googleApiKey
      },
    }
    request(options, (err, res, body) => {
      if(err) {
        reject(err);
      } else {
        try {
          const json = JSON.parse(body);
          const { routes } = json;
          if(routes.length < 1) {
            return resolve(null);
          }
          const route = routes[0];
          const durationInSeconds = route.legs.reduce((sum, leg) => {
            return sum + leg.duration.value;
          }, 0);
          return resolve(durationInSeconds / 60);
        } catch(err) {
          reject(err);
        }
      }
    })
  });
}

// Begin execution

const client = new craigslist.Client({
  city : 'Atlanta',
});
const options = {
  category : 'apa',
};

const workLoc = '147 Technology Pkwy #100, Norcross, GA 30092';
function getResults() {}
client.list(options).then(async (results) => {
  for(const result of results) {
    const { location, title, price, url } = result;
    let locationToUse = location;
    const { mapUrl } = await client.details(result);
    if(mapUrl) {
      //console.log(mapUrl);
      locationToUse = mapUrl.match(/q=loc%3A+(.*)|@(-*\d*\.\d*,-*\d*\.\d*)/)[0];
    }
    let priceNum = 0;
    if(price !== null) {
      priceNum = Number(price.slice(1));
    }
    try {
      const distInMin = await getDistanceInMinutes(location, workLoc);
      if(distInMin > 25) continue;
      console.log(`${title}: ${distInMin} min, ${priceNum}$`)
    } catch(err) {
      console.error(err);
    }
  }
}).catch(console.error);