'use strict'
const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
//const shortid = require('shortid');

const region = process.env.REGION;
// Create a Secrets Manager client
const client = new AWS.SecretsManager({
    region: region
});
let secrets;
let decodedBinarySecret;
// In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
// See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// We rethrow the exception by default.

let request = sId => client.getSecretValue({ SecretId: sId }, (err, data) => {
    if (err) {
        console.error(err);
        if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
    }
    else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            // STRING -> The one we want
            secrets = JSON.parse(data.SecretString);
        } else {
            // BINARY
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = JSON.parse(buff.toString('ascii'));
        }
    }
});
exports.handler = async (event, context, callback) => {
    if (event && event.httpMethod === 'POST') {
        let authorized = await auth(event);
        if (!authorized)
           return callback(null, formatBody(401, 'Unauthorized', null))
    }
    let cognitoUserData = event.body;
    //let referral_code = shortid.generate();
    // let cognitoUserData = {
    //     userName: "victoryejike@gmail.com",
    //     referralCode: "ABC"
    // }
    await request(`arn:aws:secretsmanager:us-east-2:231140637269:secret:Flywallet/prod-up98sH`).promise();

    const cognitoUser = await cognito.adminGetUser({
        UserPoolId: secrets.COGNITO_POOL_ID,
        Username: cognitoUserData.userName,
    }).promise();

    const user = cognitoUser.UserAttributes;

    if(user){
        // update cogito user to add the referral code
        await cognito.adminUpdateUserAttributes({
            UserPoolId: secrets.COGNITO_POOL_ID,
            Username: cognitoUserData.userName,
            UserAttributes: [
                {
                    Name: 'custom:referral_code',
                    Value: cognitoUserData.referralCode
                    // Value: referral_code
                }
            ]
        }).promise();

        // return success
        callback(null, {
            'statusCode': 200,
            message: `Successfully updated referral code ${cognitoUserData.referralCode}`
            // message: `Successfully updated referral code ${referral_code}`,
            // body: `${referral_code}`
        })
    }
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