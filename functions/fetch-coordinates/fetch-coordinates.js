// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const axios = require("axios");
const handler = async (event) => {
  const { postal_code } = event.queryStringParameters;
  const api_key = process.env.GEO_KEY;
  const url = `https://api.geocod.io/v1.6/geocode?postal_code=${postal_code}&api_key=${api_key}`;

  try {
    const { data } = await axios.get(url);
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    const { status, statusText, headers, data } = error.response;
    return {
      statusCode: status,
      body: JSON.stringify({ status, statusText, headers, data }),
    };
  }
};




module.exports = { handler };
