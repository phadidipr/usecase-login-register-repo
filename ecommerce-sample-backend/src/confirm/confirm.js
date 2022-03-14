const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const utils = require('../common/utils');

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
    console.log('confirm event:', event);
    const { email, code, employeeId } = JSON.parse(event.body);
    // For non-employee, pass in employeeId as empty string!!
    console.log('email:', email);
    console.log('code:', code);
    console.log('employeeId:', employeeId);
    let userPool;
    if (employeeId)
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataEmployee);
    else
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolDataVisitor);
    const userData = {
        Username: email,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    console.log('user:', cognitoUser);
    const response = await confirmUser(code, true, cognitoUser);
    console.log(response);
    if (response === 'SUCCESS')
        return utils.createResponse(200, `user ${email} confirmed`);
    else
        return utils.createResponse(401, `user ${email} not confirmed`);
}

function confirmUser(code, forceAliasCreation, cognitoUser) {
    return new Promise((resolve) => {
        console.log('authenticationCode:', code);
        console.log('forceAliasCreation:', forceAliasCreation);
        console.log('cognitoUser:', cognitoUser);

        cognitoUser.confirmRegistration(code, forceAliasCreation, function (err, result) {
            if (err) {
                console.log('confirmUser error:', err);
                return;
            }
            console.log('confirmUser result:', result);
            resolve(result);
        });
    });
}