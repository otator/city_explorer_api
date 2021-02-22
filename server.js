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
  superagent.get(URL)
  .then( locationData=>{
    // res.send(locationData);
    const locationObject = new Location(city, locationData.body[0]);
    res.send(locationObject);
  })
  .catch(()=>{
    res.status(500).send("Error occurred");
  })
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

// server.get('*', (req, res)=>{
//   res.status(404).send('<img style="background-size:cover;" src="https://i2.wp.com/learn.onemonth.com/wp-content/uploads/2017/08/1-10.png?w=845&ssl=1">');
// });

//start listening on the port 
server.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT} ...`);
});


//https://us1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json
//https://us1.locationiq.com/v1/search.php?key=pk.3e75c4e3b1e3d78ec758e9b2dd5ede4e&q=Amman&format=json

//pk.3e75c4e3b1e3d78ec758e9b2dd5ede4e