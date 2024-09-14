import dotenv from 'dotenv'
dotenv.config()

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

import request from 'request';

var url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`;

request.get({
    url: url,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      console.log(data);
    }
});