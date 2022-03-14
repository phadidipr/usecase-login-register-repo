'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const utils = require('../common/utils');
//const config = require('../common/config');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.setPromisesDependency(require('bluebird'));
const Jimp = require("jimp")
const s3 = new AWS.S3()
const multipartParser = require('aws-multipart-parser');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const MAX_SIZE = 4000000 // 4MB
const PNG_MIME_TYPE = "image/png"
const JPEG_MIME_TYPE = "image/jpeg"
const JPG_MIME_TYPE = "image/jpg"
const MIME_TYPES = [PNG_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE]

const poolDataEmployee = {
    //UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    //ClientId: process.env.AWS_COGNITO_CLIENT_ID
    UserPoolId: 'us-west-2_PmYuMOJoF',
    ClientId: 'df7f6332n0dg6i1dm5ik2q5b'
};

const poolDataVisitor = {
    //UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    //ClientId: process.env.AWS_COGNITO_CLIENT_ID
    UserPoolId: 'us-west-2_yNwwTqvlK',
    ClientId: '1vb4ksnqco3dmua8c2fel3g8tb'
};

module.exports.handler = async (event, context, callback) => {
    try {
        console.log('event:', event);
        const formData = await multipartParser.parse(event, false)
        console.log('formData:', formData);
        const file = formData.profilePic;
        console.log('profilePic:', file)
        console.log('profilePic contents:', file.content)
        const firstName = formData.firstName;
        const lastName = formData.lastName;
        const email = formData.email;
        const password = formData.password;
        let employeeId;
        if (formData.employeeId)
            employeeId = formData.employeeId;

        const bucket = process.env.BACKEND_PICTURES;

        const originalKey = `photos/${email}_original_${file.filename}`;
        console.log('originalKey:', originalKey);
        //let uploadResult;

        try {
            const bodyStream = fs.createReadStream(file.filename);
            const uploadResult = await uploadToS3(bucket, originalKey, file.content, file.contentType);
            console.log("uploadToS3 result:", uploadResult)
        } catch (err) {
            return utils.createResponse(err.status, err);
        }
        let signedOriginalUrl;
        try {
            signedOriginalUrl = await s3.getSignedUrl("getObject", { Bucket: bucket, Key: originalKey })
            console.log('file URL:', signedOriginalUrl);
        } catch (err) {
            return utils.createResponse(err.status, err);
        }

        let dbParams;
        if (formData.employeeId) {
            console.log(`formData.employeeId: ${formData.employeeId}`);
            dbParams = {
                TableName: process.env.ACCOUNT_TABLE,
                Item: {
                    firstName,
                    lastName,
                    email,
                    password,
                    employeeId,
                    profilePic: signedOriginalUrl
                }
            };
        } else
            dbParams = {
                TableName: process.env.ACCOUNT_TABLE,
                Item: {
                    firstName,
                    lastName,
                    email,
                    password,
                    profilePic: signedOriginalUrl
                }
            };
        console.log('dbParams:', dbParams);
        try {
            if (formData.employeeId) {
                const response = await registerUser(email, password, employeeId);
                console.log(response);
            }
            else {
                const response = await registerUser(email, password, '');
                console.log(response);
            }
            await dynamoDb.put(dbParams).promise();
            return utils.createResponse(200, `user ${email} added`);
        } catch (err) {
            console.log('dynamodb query error:', err);
            utils.createResponse(err.status, err);
        }
    } catch (err) {
        return utils.createResponse(err.status, err);
    }

}

const isAllowedFile = (size, mimeType) => {
    if (size > MAX_SIZE || (mimeType != PNG_MIME_TYPE && mimeType != JPEG_MIME_TYPE && mimeType != JPG_MIME_TYPE))
        return false;
    return true;
}

const uploadToS3 = async (bucket, key, buffer, mimeType) => {
    const params = { Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType, ContentEncoding: 'base64' };
    console.log('uploadToS3 params:', params);
    try {
        const data = await s3.upload(params).promise()
        console.log('uploadToS3 data to return:', data)
        return data;
    } catch (err) {
        console.log('uploadToS3 error:', err)
        return err;
    }

    //return new Promise((resolve, reject) => {
    //    s3.upload(params, (err, data) => {
    //        if (err) {
    //            return reject(err);
    //        } return resolve(data);
    //    })
    //})
}

const resize = (buffer, mimeType, width) =>
    new Promise((resolve, reject) => {
        Jimp.read(buffer)
            .then(image => image.resize(width, Jimp.AUTO).quality(70).getBufferAsync(mimeType))
            .then(resizedBuffer => resolve(resizedBuffer))
            .catch(error => reject(error))
    });



function registerUser(email, password, employeeId) {
    return new Promise((resolve) => {
        let userPool;

        if (employeeId)
            userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataEmployee);
        else
            userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataVisitor);

        console.log('userPool:', userPool);
        var attributeList = [];
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        attributeList.push(attributeEmail);
        userPool.signUp(email, password, attributeList, null, function (err, result) {
            if (err) {
                console.log('signUp error:', err);
                return;
            }
            const cognitoUser = result.user;
            console.log('user name is ', cognitoUser.getUsername());
            console.log('signUp result:', result);
            resolve(result);
        });
    });
}