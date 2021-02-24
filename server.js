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
const MOVIES_KEY = process.env.MOVIES_KEY;
const YELP_KEY = process.env.YELP_KEY;
const pg =require('pg');
//this line of code for connection from heroku, Uncomment this line when you deploy the changes to heroku
const client = new  pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

//this line of code to test your server locally. Comment this line when you upload the changes to heroku.
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


});//end of parks route function

server.get('/movies', (req, res)=>{
  // console.log(req.query);
  let URL = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIES_KEY}&query=${req.query.search_query}`;
  let arrOfMovies = [];
  superagent.get(URL)
  .then(data=>{
    // res.send("Check your logs")
    arrOfMovies = data.body.results.map(value => new Movie(value));
    // let result = results.body;

    // let newMovie = new Movie(result);
    // console.log(newMovie);
    res.send(arrOfMovies)

  })
  .catch((error)=>{
    console.log("Erroer in data movies route", error.message);
  })

});//end of movies route


let numberOfItemsPerPage = 5;
let offset = 0;
server.get('/yelp', (req, res)=>{
  // console.log('Page number:',req.query.page);
  
  let URL = `https://api.yelp.com/v3/businesses/search?term=restaurant&location=${req.query.search_query}&limit=${numberOfItemsPerPage}&offset=${offset}`;
  let arrOfRestaurants = [];
  
  superagent.get(URL)
  .set({'Authorization':`Bearer ${YELP_KEY}`})
  .then(data=>{
    
    offset+=numberOfItemsPerPage;
    arrOfRestaurants = data.body.businesses.map(value => new Yelp(value));
    console.log(arrOfRestaurants);
    res.send(arrOfRestaurants);

  })
  .catch(error=>{
    console.log('Error in yelp api', error.message);
  })

});//end of yelp route.

function Yelp(obj){
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}


function Movie(obj){
  this.title=obj.title;
  this.overview = obj.overview;
  this.average_votes= obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w500'+ obj.poster_path;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}

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

