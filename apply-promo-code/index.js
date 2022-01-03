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
    //     promoCode: "XYZ",
    //     userName: "Soum",
    //     currentPrice: 10000
    // }
    // get the promo code from the request
    let promoCodeParam = {
        TableName: 'promo_codes',
        KeyConditionExpression: '#promo_code = :code',
        ExpressionAttributeNames: {
            '#promo_code': 'Code'
        },
        ExpressionAttributeValues: {
            ':code': data.promoCode
        }
    }

    const promoCodeData = await getData(promoCodeParam);
    // check if the promo code is valid and the type of promo code
    if (promoCodeData.length > 0) {
        // check if the promo code is valid and the type of promo code
        if (promoCodeData[0].Expired === false) {
            if (promoCodeData[0].IsPublic) {
                // check if the user has already used the promo code
                let userPromoCodeParam = {
                    TableName: 'user_promo_codes',
                    KeyConditionExpression: '#user_id = :user_id',
                    ExpressionAttributeNames: {
                        '#user_id': 'UserName'
                    },
                    ExpressionAttributeValues: {
                        ':user_id': data.userName
                    }
                }

                let userPromoCodeData = await getData(userPromoCodeParam);
                console.log("user data: " + userPromoCodeData);
                if (userPromoCodeData.length > 0) {
                    // user has already used the promo code
                    callback(null, {
                        statusCode: 200,
                        body: JSON.stringify({
                            message: 'Promo code already used'
                        })
                    })
                }
                else {
                    // apply the promo code to the user
                    let userPromoCodesParams = {
                        TableName: 'user_promo_codes',
                        Item: {
                            UserName: data.userName,
                            PromoCode: data.promoCode
                        }
                    }

                    // store the promo code in the user_promo_codes table
                    let returnValue = await putData(userPromoCodesParams);
                    if (returnValue === "Success") {
                        if (promoCodeData[0].Type === 'numeric') {
                            console.log("price:" + data.currentPrice)
                            // get the current price from the request
                            let currentPrice = data.currentPrice
                            // calculate the new price
                            let newPrice = currentPrice - promoCodeData[0].Value
                            console.log(newPrice);
                            // return the new price
                            callback(null, formatBody(200, 'Promo Code Applied', { price: newPrice }));
                        }
                    } else {
                        callback(null, formatBody(500, "Error applying promo code", null));
                    }


                }
            }
            else {
                // check the promoCode is assigned to the user
                if (promoCodeData.Items[0].UserName === data.userName) {
                    if (promoCodeData[0].Type === 'numeric') {
                        // get the current price from the request
                        let currentPrice = data.currentPrice
                        // calculate the new price
                        let newPrice = currentPrice - promoCodeData[0].Value
                        console.log(newPrice);
                        // return the new price
                        callback(null, formatBody(200, 'Promo Code Applied', { price: newPrice }));
                    }
                }
                else {
                    // promo code is not assigned to the user
                    callback(null, formatBody(200, 'Promo Code not assigned to user', {}));
                }
            }
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