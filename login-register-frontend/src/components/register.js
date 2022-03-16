import React, { useState, useEffect } from 'react';
import { withRouter, useHistory } from 'react-router-dom';
import { Avatar, Button, Grid, Paper, TextField } from '@material-ui/core';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import axios from 'axios';
import { useAlert } from 'react-alert';

function Register() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    let history = useHistory();
    const alert = useAlert();

    let regex = new RegExp('^[0-9A-Z]{12}$');

    const paperStyle = {
        padding: 20,
        height: '70vh',
        width: 280,
        margin: '20px auto'
    };
    const avatarStyle = { backgroundColor: '#029b19' };
    const btstyle = { margin: '8px 0' };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        if (name === 'email') {
            setEmail(value);
        }
        if (name === 'firstName') {
            setFirstName(value);
        }
        if (name === 'lastName') {
            setLastName(value);
        }
        if (name === 'employeeId') {
            setEmployeeId(value);
        }
        if (name === 'password') {
            setPassword(value);
        }
    };

    const handleFileUpload = (event) => {
        if (event && event.target && event.target.files) {
            setProfilePic(event.target.files[0]);
        }
    };

    const createFormData = async () => {
        const formData = new FormData();
        await formData.append("email", email);
        await formData.append("firstName", firstName);
        await formData.append("lastName", lastName);
        if (employeeId !== "")
            await formData.append("employeeId", employeeId);
        await formData.append("password", password);
        await formData.append("profilePic", profilePic, profilePic.name);
        return formData;
    }

    const onRegister = async () => {
        if (employeeId !== "" && !regex.test(employeeId)) {
            alert.show('Enter a valid employeeId');
            return;
        }
        if (employeeId !== "" && !email.includes("@presidio.com")) {
            alert.show('employeeId requires a Presidio email address');
            return;
        }
        const formData = await createFormData();
        console.log('createFormData:', formData.entries);
        

        const result = await axios({
            url: "https://yu3rax9pf7.execute-api.us-west-2.amazonaws.com/dev/register",
            method: "post",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
                "Accept": "*"
            }
        });

        console.log('result:', result);
        if (result.status === 200) {
            if (employeeId !== "") {
                const pageData = {
                    firstName: result.data.firstName,
                    lastName: result.data.lastName,
                    email: result.data.email,
                    employeeId: result.data.employeeId,
                    profilePic: result.data.profilePic

                };
                history.push({ pathname: '/employee', state: pageData });
            }
            else {
                const pageData = {
                    firstName: result.data.firstName,
                    lastName: result.data.lastName,
                    email: result.data.email,
                    profilePic: result.data.profilePic

                };
                history.push({ pathname: '/visitor', state: pageData });
            }
        } else {
            console.log('API result:', result);
            alert.show(result.body);
        }
    };

    const handleRegister = async () => {
        await onRegister();
    };

    useEffect(() => {
        (async () => {
            await handleFileUpload();
        })();
    }, []);

    return (
        <Grid align="center">
            <Paper elevation={10} style={paperStyle}>
                <Avatar style={avatarStyle}>
                    <LockOutlinedIcon />
                </Avatar>
                <h2>Create your account</h2>
                <TextField
                    value={email}
                    name="email"
                    label="Email"
                    placeholder="Enter your email address"
                    fullWidth
                    required
                    onChange={handleFieldChange}
                />
                <TextField
                    value={firstName}
                    name="firstName"
                    label="First Name"
                    placeholder="Enter your first name"
                    fullWidth
                    required
                    onChange={handleFieldChange}
                />
                <TextField
                    value={lastName}
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter your last name"
                    fullWidth
                    required
                    onChange={handleFieldChange}
                />
                <TextField
                    value={employeeId.toUpperCase()}
                    name="employeeId"
                    label="Employee ID"
                    placeholder="Enter your employee ID number"
                    fullWidth
                    onChange={handleFieldChange}
                />
                <TextField
                    value={password}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    fullWidth
                    required
                    type="password"
                    onChange={handleFieldChange}
                />
                <br />
                <br />
                Upload your profile picture
                <br />
                <input type="file" label="Profile Pic" onChange={handleFileUpload} />
                <br />
                <br />
                <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    style={btstyle}
                    onClick={() => {
                        handleRegister();
                    }}
                >
                    Register Your New Account
                </Button>
            </Paper>
            <a href='/'>Already Registered? Login Here</a>
        </Grid>
    );
}

export default withRouter(Register);
