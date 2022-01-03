'use strict'
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
exports.handler = async (event, context, callback) => {
    if (event && event.httpMethod === 'POST') {
        let authorized = await auth(event);
        if (!authorized)
           return callback(null, formatBody(401, 'Unauthorized', null))
    }
    let data = event.body;
    // let data = {
    //     referrer_user_id: "1",
    //     user_id: "2"
        
    // }
    let params = {
        TableName: 'referrals',
        Item: {
            "referrer_id": data.referrer_user_id,
            "user_id": data.user_id,
            "Date": new Date().toISOString(),
        }
    }

    const inserted = await putData(params);
    if (inserted === "Success") {
        callback(null, formatBody(200, 'Referral code inserted', data));
    } else {
        callback(null, formatBody(500, "Error inserting referral code", null));
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