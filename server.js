'use strict';

//location data
// const locationData = require('./data/location.json');
// const weatherData = require('./data/weather.json');

//importing the express package
const express = require('express');

//initialize the server
const server = express();
//import .env configuration
require('dotenv').config();

//importing cors to open the server for any request
const cors = require('cors');

//the port of the server
const PORT = process.env.PORT || 17001;

//make the server open for any website to make request
server.use(cors());

const superagent = require('superagent');
const MY_KEY = process.env.MY_KEY;
const WEATHER_KEY = process.env.WEATHER_KEY;
const PARK = process.env.PARK;
const pg =require('pg');
const client = new  pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
// const client = new  pg.Client(process.env.DATABASE_URL);



//the home route of the server
server.get('/', (req, res)=>{
  //sending response as moving header in the main route
  //res.send("<marquee><h1>Welcome To The Home Page<h1><marquee>");
  res.send("Home Page");
});
let city;
server.get('/location', (req, res)=>{
  city = req.query.city;
  let URL = `https://us1.locationiq.com/v1/search.php?key=${MY_KEY}&q=${city}&format=json`;
  // console.log(URL);

  let found = false;
  let SQL  = `select * from location;`;
  client.query(SQL)
  .then(results =>{
    if(results.rows.length){
        for(let value = 0; value<results.rows.length; value++){
        // console.log("++++"+value.city_name.toLowerCase(),city.toLowerCase()+"++++")
        if(results.rows[value].city_name.toLowerCase() === city.toLowerCase()){
          found = true;
          // console.log("Found = ", found);
          console.log("found city in database");

          let locationObject = new Location(city, results.rows[value]);
          res.send(locationObject);
          // console.log("Results from database => ", locationObject);
          break;
        }
      }
    }
    if(!found){
      superagent.get(URL)
      .then( locationData=>{
        // res.send(locationData);
        let locationObject = new Location(city, locationData.body[0]);
        
        // console.log(locationObject.formatted_query);
        res.send(locationObject);
        let SQL = `insert into location values ($1, $2, $3, $4);`;
        let safeData = [locationObject.search_query, locationObject.formatted_query, locationObject.longitude, locationObject.latitude];
        client.query(SQL, safeData).then(()=> console.log("row inserted successfully")).catch(error=> console.log("Error in insert",error.message));
      })
      .catch(()=>{
        res.status(500).send("Error occurred");
      })
    }
  }).catch(error => console.log("Error in select: ", error.message));

  
});

server.get('/weather', (req, res) =>{
  let arrOfWeather = [];
  // let city = req.query.city;
  let datax;
  let URL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${WEATHER_KEY}`;
  superagent.get(URL)
  .then(weatherData =>{
    datax = JSON.parse(weatherData.text).data;
    arrOfWeather=datax.map(value=>new Weather(value));
    res.send(arrOfWeather);

    // return arrOfWeather;

  })
  .catch(()=>{
    res.send('Error in weather code');
  });
});

/*
[
    {
     "name": "Klondike Gold Rush - Seattle Unit National Historical Park",
     "address": "319 Second Ave S." "Seattle" "WA" "98104",
     "fee": "0.00",
     "description": "Seattle flourished during and after the Klondike Gold Rush. Merchants supplied people from around the world passing through this port city on their way to a remarkable adventure in Alaska. Today, the park is your gateway to learn about the Klondike Gold Rush, explore the area's public lands, and engage with the local community.",
     "url": "https://www.nps.gov/klse/index.htm"
    },
    {
     "name": "Mount Rainier National Park",
     "address": ""55210 238th Avenue East" "Ashford" "WA" "98304",
     "fee": "0.00"
     "description": "Ascending to 14,410 feet above sea level, Mount Rainier stands as an icon in the Washington landscape. An active volcano, Mount Rainier is the most glaciated peak in the contiguous U.S.A., spawning five major rivers. Subalpine wildflower meadows ring the icy volcano while ancient forest cloaks Mount Rainier’s lower slopes. Wildlife abounds in the park’s ecosystems. A lifetime of discovery awaits.",
     "url": "https://www.nps.gov/mora/index.htm"
    },
    ...
] 
*/

server.get('/parks', (req,res)=>{
  let city = req.query.search_query;
  // const URL = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARK}`;
  const URL = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARK}`;

  let arrOfParks=[];
  superagent.get(URL)
  .then(parksData=>{
    // let data = JSON.parse(parksData.text).data[0];
    // let datax = JSON.parse(parksData.text).data[0];
    // res.send(datax.url);
    let data = parksData.body.data;
    let arrOfParks = data.map(value => new Park(value));
    // arrOfParks.push(new Park(datax));
    
    res.send(arrOfParks);
  })
  .catch(()=>{
    res.send('Error in parks code');
  })


});

function Park(obj){
  this.name = obj.fullName;
  this.address = Object.values(obj.addresses[0]).slice(0,4).join();
  this.fee = obj.entranceFees[0].cost;
  this.description = obj.entranceFees[0].description;
  this.url = obj.url;
}



function Location(city, obj){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj){
  this.forecast = obj.weather.description;
  this.time = obj.datetime;
}

server.get('*', (req, res)=>{
  res.status(404).send('<img style="background-size:cover;" src="https://i2.wp.com/learn.onemonth.com/wp-content/uploads/2017/08/1-10.png?w=845&ssl=1">');
});

//start listening on the port 
client.connect()
.then(()=> {
  server.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT} ...`);
  });
})
.catch(error=>{
  console.log('Error in connection: ', error.message);
})

