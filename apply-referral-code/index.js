'use strict'
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-2',
    apiVersion: '2012-08-10'
});
exports.handler = async (event, context, callback) => {

    let params = {
        TableName: 'referrals',
        item: {
            "referrer_id": {S: event.referrer_user_id},
            "user_id": {S: event.user_id},
            "Date": {S: new Date().toISOString()},
        }
    }

    await dynamodb.putItem(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err, null);
        } else {
            console.log(data);
            callback(null, data);
        }
    });


}