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

//the home route of the server
server.get('/', (req, res)=>{
  //sending response as moving header in the main route
  //res.send("<marquee><h1>Welcome To The Home Page<h1><marquee>");
  res.send("Home Page");
});

server.get('/location', (req, res)=>{
  const city = req.query.city;
  const URL = `https://us1.locationiq.com/v1/search.php?key=${MY_KEY}&q=${city}&format=json`;
  // console.log(URL);
  superagent.get(URL)
  .then( locationData=>{
    const locationObject = new Location(city, locationData.body[0]);
    res.send(locationObject);
  })
  .catch(()=>{
    res.status(500).send("Error occurred");
  })
});

// server.get('/weather', (req, res) =>{
//   const data = weatherData.data;
//   let arrOfWeather = [];
//   data.forEach(value =>{
//     arrOfWeather.push(new Weather(value));
//   });
//   res.send(arrOfWeather);
// });



function Location(city, obj){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj){
  this.forcast = obj.weather.description;
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