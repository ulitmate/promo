'use strict';
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-2'
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context, callback) => {
    if (event && event.httpMethod === 'POST') {
        let authorized = await auth(event);
        if (!authorized)
           return callback(null, formatBody(401, 'Unauthorized', null))
    }

    console.log('fetching promo codes');
    try {
        const params = {
            TableName: 'promo_codes',
            Select: "ALL_ATTRIBUTES"
        };

        let returnVal = await getData(params);
        let data = [];

        for (var i = 0; i < returnVal.length; i++) {
            if (!returnVal[i].IsExpired) {
                data.push(returnVal[i]);
            }
        }
       // return formatBody(200, JSON.stringify(data));
        callback(
            null,
            formatBody(200, data));    // successful response
    } catch (e) {
        callback(null, formatBody(500, JSON.stringify(e)));
    }
};

async function getData(params) {
    return new Promise((resolve, reject) => {
        dynamodb.scan(params, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                resolve(data.Items);
            }
        });
    });
}

function formatBody(statusCode, body) {
    return {
        "statusCode": statusCode,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": body,
        "isBase64Encoded": false
    };
}


async function auth(event) {
    var authorizationHeader = event.headers.Authorization;

    if (!authorizationHeader) return false

    var encodedCreds = authorizationHeader.split(' ')[1]
    var plainCreds = (Buffer.from(encodedCreds, 'base64')).toString().split(':')
    var username = plainCreds[0]
    var password = plainCreds[1]

    if (!(username === 'admin' && password === 'secret')) {
        console.log("Authorization failure")
        return false
    } else {
        console.log("Authorization success")
        return true;
    }
}