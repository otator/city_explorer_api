'use strict';

//importing the express package
const express = require('express');

//initialize the server
const server = express();
//import .env configuration
require('dotenv').config();

//importing cors to open the server for any request
const cors = require('cors');

//the port of the server
const PORT = process.env.PORT_ENV || 17001;

//make the server open for any website to make request
server.use(cors());

//the home route of the server
server.get('/', (req, res)=>{
  //sending response as moving header in the main route
  res.send("<marquee><h1>Welcome To The Home Page<h1><marquee>");
});

server.get('/location', getLocationData);


//start listening on the port 
server.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT} ...`);
})