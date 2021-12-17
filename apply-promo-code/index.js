'use strict'
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-2',
    apiVersion: '2012-08-10'
});
exports.handler = async  (event, context, callback) => {

    // get the promo code from the request
    let promoCodeParam = {
        TableName: 'promo_codes',
        KeyConditionExpression: '#promo_code = :code',
        ExpressionAttributeNames: {
            '#promo_code': 'Code'
        },
        ExpressionAttributeValues: {
            ':code': event.promoCode
        }
    }

    const promoCodeData = await dynamodb.query(promoCodeParam).promise()
    // check if the promo code is valid and the type of promo code
    if (promoCodeData.Count > 0) {
        // check if the promo code is valid and the type of promo code
        if (promoCodeData.Items[0].Valid === true ) {
            if (promoCodeData.Items[0].IsPublic) {
            // check if the user has already used the promo code
            let userPromoCodeParam = {
                TableName: 'user_promo_codes',
                KeyConditionExpression: '#user_id = :user_id',
                ExpressionAttributeNames: {
                    '#user_id': 'UserName'
                },
                ExpressionAttributeValues: {
                    ':user_id': event.userName
                }
            }

            let userPromoCodeData = await dynamodb.query(userPromoCodeParam).promise()
            if (userPromoCodeData.Count > 0) {
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
                        UserName: event.userName,
                        PromoCode: event.promoCode
                    }
                }

                // store the promo code in the user_promo_codes table
                await dynamodb.put(userPromoCodesParams, (err, data) => {
                    if (err) {
                        formatBody(500, "Error applying promo code", null)
                    }
                    else {
                        if (promoCodeData[0].Type === 'numeric') {
                            // get the current price from the request
                            let currentPrice = event.currentPrice
                            // calculate the new price
                            let newPrice = currentPrice - promoCodeData.Items[0].Value
                            // return the new price
                            formatBody(200, 'Promo Code Applied', { price: newPrice })
                        }
                    }
                })


            }
        }
        else {
            // check the promoCode is assigned to the user
            if(promoCodeData.Items[0].UserName === event.userName) {
                if (promoCodeData[0].Type === 'numeric') {
                    // get the current price from the request
                    let currentPrice = event.currentPrice
                    // calculate the new price
                    let newPrice = currentPrice - promoCodeData.Items[0].Value
                    // return the new price
                    formatBody(200, 'Promo Code Applied', { price: newPrice })
                }
            }
            else {
                // promo code is not assigned to the user
                formatBody(200, 'Promo Code not assigned to user', {})
            }
        }
    }
}

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