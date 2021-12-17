'use strict'
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-2'
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async = (event, context, callback) => {
    console.log('fetching promo codes')
    try {
        const params = {
            TableName: 'promo_codes',
            KeyConditionExpression: '#expiration = :expired',
            ExpressionAttributeNames: {
                '#expiration': 'Expired'
            },
            ExpressionAttributeValues: {
                ':expired': false
            }
        }

        const data = dynamodb.query(params).promise()

        console.log('promo codes fetched', data.Items)
        callback(
            null,
            formatBody(200, JSON.stringify(data.Items)));    // successful response
    } catch (e) {
        callback(null, formatBody(500, JSON.stringify(e)));
    }
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
