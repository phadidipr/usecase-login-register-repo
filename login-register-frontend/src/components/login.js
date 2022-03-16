import { useState, React } from 'react';
import { withRouter, useHistory } from 'react-router-dom';
import { Avatar, Button, Grid, Paper, TextField } from '@material-ui/core';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import axios from 'axios';
import { useAlert } from 'react-alert';

function Login() {
    const initialData = { email: '', password: '' };
    const [data, setData] = useState(initialData);
    let history = useHistory();
    const alert = useAlert();

    const paperStyle = {
        padding: 20,
        height: '70vh',
        width: 280,
        margin: '20px auto'
    };
    const avatarStyle = { backgroundColor: '#029b19' };
    const btstyle = { margin: '8px 0' };

    const handleTextFieldChange = (event) => {
        const { name, value } = event.target;
        setData({ ...data, [name]: value });
    };

    const onLogin = async () => {
        const email = data.email;
        const password = data.password;

        //event.preventDefault();

        const result = await axios.post(
            'https://yu3rax9pf7.execute-api.us-west-2.amazonaws.com/dev/login', {

            email,
            password,

            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
        });
        console.log(result);
        if (result.status === 200 && result.data.email) {
            const resultData = result.data;
            //console.log('parsed data:', resultData)
            let pageData;
            if (resultData.employeeId)
                pageData = {
                    firstName: resultData.firstName,
                    lastName: resultData.lastName,
                    employeeId: resultData.employeeId,
                    email: resultData.email,
                    profilePic: resultData.profilePic
                };
            else {
                pageData = {
                    firstName: resultData.firstName,
                    lastName: resultData.lastName,
                    email: resultData.email,
                    profilePic: resultData.profilePic
                };
            }
            // setData({
            //   ...data,
            //   userRole: pageData.userRole,
            //   userId: pageData.userId
            // });
            // console.log(data);
            if (pageData.employeeId) {
                history.push({ pathname: '/employee', state: pageData });
            } else {
                history.push({ pathname: '/visitor', state: pageData });
            }
        } else {
            //console.log(result);
            alert.show('Inorrect email and/or password');
        }
    };

    const handleLogin = async () => {
        await onLogin();
    };

    return (
        <Grid align="center">
            <Paper elevation={10} style={paperStyle}>
                <Avatar style={avatarStyle}>
                    <LockOutlinedIcon />
                </Avatar>
                <h2>Sign in to your account</h2>
                <TextField
                    value={data.email}
                    name="email"
                    label="Email"
                    placeholder="Enter your email address"
                    fullWidth
                    required
                    onChange={handleTextFieldChange}
                />
                <TextField
                    value={data.password}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    fullWidth
                    required
                    type="password"
                    onChange={handleTextFieldChange}
                />
                <br />
                <br />
                <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    style={btstyle}
                    onClick={() => {
                        handleLogin();
                    }}
                >
                    Login
                </Button>
            </Paper>
            <a href='/register'>New User? Register Here</a>
        </Grid>
    );
}

export default withRouter(Login);
