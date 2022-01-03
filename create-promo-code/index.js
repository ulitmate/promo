'use strict'
const AWS = require('aws-sdk');

var dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context, callback) => {
    if (event && event.httpMethod === 'POST') {
        let authorized = await auth(event);
        if (!authorized)
           return callback(null, formatBody(401, 'Unauthorized', null))
    }
    console.log(event.body);
    let data = event.body;

    const params = {
        TableName: 'promo_codes',
        Item: data
    }
    const inserted = await putData(params);
    if (inserted === "Success") {
        callback(null, formatBody(200, 'Promo code inserted', data));
    } else {
        callback(null, formatBody(500, "Error inserting promo code", null));
    }
}

async function putData(promoCodeParam) {
    return new Promise((resolve, reject) => {
        dynamodb.put(promoCodeParam, function (err, data) {
            if (err) {
                reject(err.message);
            } else {
                resolve("Success");
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