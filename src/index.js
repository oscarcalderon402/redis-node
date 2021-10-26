const express = require('express');
const axios = require('axios');
const redis = require('redis');
const responseTime = require('response-time');

const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

const app = express();

app.use(responseTime());
app.get('/character', async (req, res) => {
  const response = await axios.get(
    'https://rickandmortyapi.com/api/character/'
  );

  client.set('characters', JSON.stringify(response.data), (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log(result);
    res.json(response.data);
  });
});

app.listen(4000);
console.log('Server on port 4000');
