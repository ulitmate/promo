'use strict'
const AWS = require('aws-sdk');

// init dynamodb
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {

    // find the promo code
    const params = {
        TableName: 'promo_codes',
        KeyConditionExpression: '#promoCode = :code',
        ExpressionAttributeNames: {
            '#promoCode': 'Code'
        },
        ExpressionAttributeValues: {
            ':code': event.promoCode
        }
    }

    // query the promo code
    const data = dynamodb.query(params).promise()

    if (data.Items.length === 0) {
        callback(new Error('Promo code not found'));
    }

    else {
        // update the promo code username property to the user's username
        const params = {
            TableName: 'promo_codes',
            Key: {
                Code: event.promoCode
            },
            UpdateExpression: 'set #username = :username',
            ExpressionAttributeNames: {
                '#username': 'UserName'
            },
            ExpressionAttributeValues: {
                ':username': event.userName
            }
        }

        //update the promo code
        const data = dynamodb.update(params).promise()

        // return callback
        callback(null, data)
    }


}