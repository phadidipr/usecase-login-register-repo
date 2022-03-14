'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const utils = require('../common/utils');
//const config = require('../common/config');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.setPromisesDependency(require('bluebird'));
const cognito = new AWS.CognitoIdentityServiceProvider();
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

module.exports.handler = async (event, context, callback) => {
    try {
        console.log(event);
        const { email, password } = JSON.parse(event.body);
        console.log(`email: ${email}, password: ${password}`);
        if (typeof userName !== 'string' || typeof password !== 'string') {
            var params = {
                TableName: process.env.ACCOUNT_TABLE,
                Key: {
                    email
                }
                //KeyConditionExpression: "email = :email AND password = :password",
                //ExpressionAttributeNames: {
                //    "#email": "email",
                //    "#password": "password"
                //},
                //ExpressionAttributeValues: {
                //    ":email": email
                //}
            };
            const authData = { Username: email, Password: password };
            try {
                const result = await dynamoDb.get(params).promise();
                console.log('query result:', result);
                if (result.Item.email === email && result.Item.password === password) {
                    let cognitoParams;
                    if (result.Item.employeeId) {
                        cognitoParams = {
                            UserPoolId: 'us-west-2_PmYuMOJoF',
                            ClientId: 'df7f6332n0dg6i1dm5ik2q5b'
                        };
                    }
                    else {
                        cognitoParams = {
                            UserPoolId: 'us-west-2_yNwwTqvlK',
                            ClientId: '1vb4ksnqco3dmua8c2fel3g8tb'
                        };
                    }

                    const response = await authenticateUser(authData, cognitoParams);
                    console.log('Cognito Response:', response);
                    return utils.createResponse(200, result.Item);
                } else {
                    return utils.createResponse(
                        400,
                        'No matching username and/or password record'
                    );
                }
            }
            catch (err) {
                return utils.createResponse(
                    err.status,
                    err
                );
            }
        } else {
            return utils.createResponse(401, 'Invalid username and/or password');
        }
    } catch (err) {
        return utils.createResponse(err.status, err);
    }
}

function authenticateUser(authenticationData, poolData) {
    return new Promise((resolve) => {
        console.log('authenticationData:', authenticationData);
        console.log('poolData:', poolData);
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        const userData = {
            Username: authenticationData['Username'],
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        console.log('cognitoUser:', cognitoUser);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                console.log('Authorized Result:', result);
                return resolve({ statusCode: 200 });
            },
            onFailure: function (err) {
                console.log('Authentication Error:', err);
                return resolve({ statusCode: 400 });
            }
        })
    })
}