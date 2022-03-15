'use strict';

const AWS = require('aws-sdk');
const utils = require('../common/utils');
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
        //console.log('event:', event);
        const formData = await multipartParser.parse(event, true)
        //console.log('formData:', formData);
        const file = formData.profilePic;
        //TODO: get filesize
        //if (isAllowedFile)
        //console.log('profilePic:', file);
        //console.log('profilePic contents:', file.content);
        //console.log('file content size:', file.content.length);
        const firstName = formData.firstName;
        const lastName = formData.lastName;
        const email = formData.email;
        const password = formData.password;
        let employeeId;
        if (formData.employeeId) {
            employeeId = formData.employeeId.toUpperCase();
            let regex = new RegExp('^[0-9A-Z]{12}$');
            //change this to '@presidio.com' for repo/prod
            if (!regex.test(employeeId) || !email.includes("@hotmail.com"))
                return utils.createResponse(401, 'employee registration requires a Presidio email address and a valid employee ID of 12 alphanumeric characters');
        }

        const bucket = process.env.BACKEND_PICTURES;

        const originalKey = `photos/${email}_original_${file.filename}`;
        //console.log('originalKey:', originalKey);
        const thumbnailKey = `photos/${email}_thumbnail_${file.filename}`;

        try {
            await uploadToS3(bucket, originalKey, file.content, file.contentType);
            const thumbnailBuffer = await resize(file.content, file.contentType, 400);
            console.log('resized buffer:', thumbnailBuffer);
            await uploadToS3(bucket, thumbnailKey, thumbnailBuffer, file.contentType);
        } catch (err) {
            console.log('uploadToS3 error:', err)
            return utils.createResponse(err.status, err);
        }
        //let signedOriginalUrl
        let signedThumbnailUrl;
        try {
            //signedOriginalUrl = await s3.getSignedUrl("getObject", { Bucket: bucket, Key: originalKey })
            signedThumbnailUrl = await s3.getSignedUrl("getObject", { Bucket: bucket, Key: thumbnailKey })
        } catch (err) {
            return utils.createResponse(err.status, err);
        }
        //TODO: save the bucket key to db but return the url, then get the url from the bucket in login
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
                    profilePic: thumbnailKey,
                    profilePicFull: originalKey
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
                    profilePic: thumbnailKey,
                    profilePicFull: originalKey
                }
            };
        console.log('dbParams:', dbParams);
        //TODO: return the URL so register and login backend both give it to the appropriate frontend
        try {
            if (formData.employeeId) {
                const response = await registerUser(email, password, employeeId);
                console.log(response);
                await dynamoDb.put(dbParams).promise();
                return utils.createResponse(200, {
                    firstName,
                    lastName,
                    email,
                    employeeId,
                    profilePic: signedThumbnailUrl
                });
            }
            else {
                const response = await registerUser(email, password, '');
                console.log(response);
                await dynamoDb.put(dbParams).promise();
                return utils.createResponse(200, {
                    firstName,
                    lastName,
                    email,
                    profilePic: signedThumbnailUrl
                });
            }
        } catch (err) {
            //console.log('dynamodb query error:', err);
            return utils.createResponse(err.status, err);
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

const uploadToS3 = async (bucket, key, body, mimeType) => {
    const params = { Bucket: bucket, Key: key, Body: body, ContentType: mimeType };
    //console.log('uploadToS3 params:', params);
    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                //console.log('s3 upload failure:', err);
                return reject(err);
            }
            //console.log('s3 upload success:', data);
            return resolve(data);
        })
    })
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

        //console.log('userPool:', userPool);
        var attributeList = [];
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        attributeList.push(attributeEmail);
        userPool.signUp(email, password, attributeList, null, function (err, result) {
            if (err) {
                //console.log('signUp error:', err);
                return;
            }
            const cognitoUser = result.user;
            //console.log('user name is ', cognitoUser.getUsername());
            console.log('signUp result:', result);
            resolve(result);
        });
    });
}