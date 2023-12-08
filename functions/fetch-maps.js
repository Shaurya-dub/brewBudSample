const handler = async (event) => {
  const api_key = process.env.MAPS_KEY;

  try {
    return {
      statusCode: 200,
      body: JSON.stringify(api_key),
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
