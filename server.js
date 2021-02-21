'use strict';

//location data
const locationData = require('./data/location.json');
const weatherData = require('./data/weather.json');

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

//the home route of the server
server.get('/', (req, res)=>{
  //sending response as moving header in the main route
  //res.send("<marquee><h1>Welcome To The Home Page<h1><marquee>");
  res.send("Home Page");
});

server.get('/location', (req, res)=>{
  const locationObject = new Location(locationData);
  res.send(locationObject);
});


function Location(obj){
  this.search_query = "Lynnwood";
  this.formatted_query = obj[0].display_name;
  this.latitude = obj[0].lat;
  this.longitude = obj[0].lon;
}

//start listening on the port 
server.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT} ...`);
});