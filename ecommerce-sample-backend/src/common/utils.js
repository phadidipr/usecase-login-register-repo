const createResponse = (responseCode, responseBody) => {
    console.log('responseBody:', responseBody)
    const response = {
        statusCode: responseCode,
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers
        },
        body: JSON.stringify(responseBody)
    };
    console.log(`Sending response: ${JSON.stringify(response)}`);
    return response;
};

module.exports = { createResponse };