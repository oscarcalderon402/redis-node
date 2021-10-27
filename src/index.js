const express = require('express');
const axios = require('axios');
const redis = require('redis');
const responseTime = require('response-time');
const { promisify } = require('util');

const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

const app = express();

app.use(responseTime());
app.get('/character', async (req, res) => {
  try {
    // Search Data in Redis
    const reply = await GET_ASYNC('character');

    // if exists returns from redis and finish with response
    if (reply) return res.send(JSON.parse(reply));

    // Fetching Data from Rick and Morty API
    const response = await axios.get(
      'https://rickandmortyapi.com/api/character'
    );

    // Saving the results in Redis. The "EX" and 10, sets an expiration of 10 Seconds
    const saveResult = await SET_ASYNC(
      'character',
      JSON.stringify(response.data),
      'EX',
      10
    );

    // resond to client
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

// Get a single character
app.get('/character/:id', async (req, res, next) => {
  try {
    const reply = await GET_ASYNC(req.params.id);

    if (reply) {
      console.log('using cached data');
      return res.send(JSON.parse(reply));
    }

    const response = await axios.get(
      'https://rickandmortyapi.com/api/character/' + req.params.id
    );
    const saveResult = await SET_ASYNC(
      req.params.id,
      JSON.stringify(response.data),
      'EX',
      15
    );

    console.log('saved data:', saveResult);

    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

app.listen(4000);
console.log('Server on port 4000');
