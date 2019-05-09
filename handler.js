'use strict';
var rp = require('request-promise');
const pConfig = require("./src/configuration/publicConfig");

const OPTIONS = pConfig.rp.OPTIONS;
const RETRYCOUNT = 2;

async function scrapeHrefs(uri, retryCount=0) {
  var cars = [];

  try {
    var $ = await rp({...OPTIONS, uri});
    $('ul.rows a.result-image').attr('href',
      (i, e) => {
        cars.push(e);
      })

  }
  catch(err) {
    if (retryCount < RETRYCOUNT) {
      return await scrapeHrefs(uri, retryCount + 1);
    }
    console.log("getCarHrefs = ", err);
    return Promise.reject(err);
  }

  return cars;
}

function buildCraigsUrl(params) {
  var url = '';
  for (var k in params) {
    if (params[k]) {
      url += "&" + k + '=' + params[k]
    }
  }

  return url;
}

async function getCarHrefsWithSearch(params) {

  var {city, query} = params;
  delete params['city'];

  params['query'] = query.replace(/\s+/gi, '+');

  // var uri = 'https://' + city + '.craigslist.org/search/cto?query=' + query + '&sort=date&srchType=T&auto_transmission=2&hasPic=1&bundleDuplicates=1&min_price=0&max_price=20000&auto_title_status=1';
  var uri = 'https://' + city + '.craigslist.org/search/cto?sort=date&srchType=T&auto_transmission=2&hasPic=1&bundleDuplicates=1&auto_title_status=1'
   + buildCraigsUrl(params);
  console.log(uri);

  return await scrapeHrefs(uri);
}

async function callGetCars(carHrefs) {
  console.log(carHrefs);
  return [1,2,3];
}

async function shardCars(carHrefs) {
  var acc = [];
  var shardCount = 10;
  for(var start = 0; start < 50; start+=shardCount) {
      acc.push(callGetCars(carHrefs.slice(start, start+shardCount)));
  }
  
  var cars = await Promise.all(acc);
  cars = cars.reduce((acc, curr) => {
    return acc.concat(curr);
  }, []);
  return cars;
}


module.exports.carLinks = async (event, context) => {

  context.callbackWaitsForEmptyEventLoop = false;
  try {
      var startTime = new Date();

      console.log("event", event);
      var input = JSON.parse(event.body);
      console.log("input = ", input);

      var carHrefs = await getCarHrefsWithSearch(input);

      // Filter duplicate links.
      var seen = {};
      carHrefs = carHrefs.filter((item) => {
          return seen.hasOwnProperty(item) ? false : (seen[item] = true);
      });

      var cars = await shardCars(carHrefs);
      console.log(cars);

      cars = cars.filter((element, index) => {
          return element !== null;
      });

      // Sort
      carsResolved.sort((a, b) => {
          return (a.percentAboveKbb - b.percentAboveKbb);
      })

      console.log("carsResolved = ", carsResolved);
      console.log("result length = ", carsResolved.length);
      console.log("expected length = ", cars.length);

      var endTime = new Date();
      var timeDiff = endTime - startTime; //in ms
      // strip the ms
      timeDiff /= 1000;
      console.log("time = ", timeDiff);

      var rr = {
          statusCode: 200,
          body: JSON.stringify({
              cars: carsResolved
          }),
      };
  }
  catch(err) {
    console.log("Caught global exception, err = ", err);
  }


  return rr;
};

var input = {query: "mercedes-benz", city: "sandiego"};
// var input = {query: "honda accord", city: "sandiego"};
module.exports.carLinks({body: JSON.stringify(input)}, {callbackWaitsForEmptyEventLoop: false});