'use strict'
const AWS = require('aws-sdk');

// init dynamodb
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event, context, callback) {
    if (event && event.httpMethod === 'POST') {
        let authorized = await auth(event);
        if (!authorized)
           return callback(null, formatBody(401, 'Unauthorized', null))
    }
    let sampleData = event.body;
    // let sampleData = {
    //     promoCode: "XYZ",
    //     userName:"Soum"
    // }

    // find the promo code
    const params = {
        TableName: 'promo_codes',
        KeyConditionExpression: '#promoCode = :code',
        ExpressionAttributeNames: {
            '#promoCode': 'Code'
        },
        ExpressionAttributeValues: {
            ':code': sampleData.promoCode
        }
    };

    // query the promo code
    //const data = dynamodb.query(params).promise()
    const data = await getData(params);

    if (data.length === 0) {
        callback(new Error('Promo code not found'));
    }

    else {
        // update the promo code username property to the user's username
        const params = {
            TableName: 'promo_codes',
            Key: {
                Code: sampleData.promoCode
            },
            UpdateExpression: 'set #username = :username',
            ExpressionAttributeNames: {
                '#username': 'UserName'
            },
            ExpressionAttributeValues: {
                ':username': sampleData.userName
            }
        }

        //update the promo code
        const data = await update(params);
        if (data === "Success") {
            // return callback
            callback(null, formatBody(200, 'Promo code updated', data));
        } else {
            callback(null, formatBody(500, "Error updating promo code", data));
        }


    }
}

async function getData(promoCodeParam) {
    return new Promise((resolve, reject) => {
        dynamodb.query(promoCodeParam, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("Query succeeded.");
                data.Items.forEach(function (item) {
                    console.log(" -", item.Code + ": " + item.Value);
                });
                resolve(data.Items);
            }
        });
    });
}


async function update(promoCodeParam) {
    return new Promise((resolve, reject) => {
        dynamodb.update(promoCodeParam, function (err, data) {
            if (err) {
                console.log(err);
                reject(err.message);
            } else {
                resolve("Success");
            }
        });
    });
}

function formatBody(statusCode, message, body) {
    return {
        "statusCode": statusCode,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "message": message,
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