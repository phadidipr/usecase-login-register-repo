import { React } from 'react';
import { Button } from '@material-ui/core';
import { useHistory, useLocation, withRouter, Redirect } from 'react-router-dom';
//import { Login } from ('./login.js');

function EmployeePage() {
    const btstyle = { margin: '8px 0' };
    let history = useHistory();
    let location = useLocation();
    if (!location.state) {
        history.push('/'); //Automatically redirect to login page when no credentials are given
        return <Redirect to='/' />
    }
    let profilePic = location.state.profilePic;

    const onLogout = async () => {
        history.push('/');
    };

    const handleLogout = async () => {
        await onLogout();
    };
    
    return (
        <div align="center">
            <h2>Employee</h2>
            <img src="https://d2cb8l2mjjn9v9.cloudfront.net/common/logo.png" />
            <br />
            <img src={profilePic} />
            <br />
            <Button
                type="submit"
                color="primary"
                variant="contained"
                style={btstyle}
                onClick={() => {
                    handleLogout();
                }}
            >
                Logout
            </Button>
        </div>

    );
}

export default withRouter(EmployeePage);