'use strict'
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-2',
    apiVersion: '2012-08-10'
});

exports.handler = async (event, context, callback) => {
    const params = {
        TableName: 'promo_codes',
        Item: {
            'Code': { S: `FlyWallet-${event.code}` },
            'IsPublic': { BOOL: event.isPublic },
            'Type': { S: event.type },
            'Value': { N: event.value },
            'UserName': { S: event.userName || '' },
            'Description': { S: event.description },
            'Expired': { BOOL: false },

        }
    }


    // write the promo code to the database
    await dynamodb.putItem(params, function (err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            console.log(data);
            callback(null, data);
        }
    }

    );
}