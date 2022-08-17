const express = require('express');
const Datastore = require('nedb');
const fetch = require('node-fetch');
require('dotenv').config();
const port = process.env.PORT || 3000;

// Express Server
const app = express();
app.listen(port, () => console.log(`Listening at port ${port}`));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

// NeDB Database
const database = new Datastore('database.db');
database.loadDatabase();

app.get('/database', (request, response) => {
  database.find({}, (err, data) => {
    if (err) {
      response.end();
      return;
    }
    response.json(data);
  });
});

app.post('/database', (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  data.timestamp = timestamp;

  console.log('data from the client: ', request.body);
  database.insert(data);
  response.json(data);
});

//! Weather api request
app.get('/weather/:latlong', async (request, response) => {
  const coordinates = request.params.latlong.split(',');
  const lat = coordinates[0];
  const long = coordinates[1];

  //! Weather
  const weatherApiKey = process.env.WEATHER_API_KEY;
  const weather_fetch_response = await fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${long}?key=${weatherApiKey}`
  );
  const weather_data = await weather_fetch_response.json();

  //! Openaq api request
  const airq_options = {
    method: 'GET',
    headers: { Accept: 'application/json' },
  };
  const airq_fetch_response = await fetch(
    `https://api.openaq.org/v2/latest?limit=10&page=1&offset=0&sort=desc&coordinates=${lat}%2C${long}&radius=500&order_by=lastUpdated&dumpRaw=false`,
    airq_options
  );
  const airq_data = await airq_fetch_response.json();

  //! Response to the client
  const data = {
    weather: weather_data,
    airq: airq_data,
  };
  console.log('data from the api: ', data);
  response.json(data);
});
