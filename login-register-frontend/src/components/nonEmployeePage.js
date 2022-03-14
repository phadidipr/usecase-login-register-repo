import { React } from 'react';
import { Button } from '@material-ui/core';
import { useHistory, withRouter } from 'react-router-dom';

function NonEmployeePage(Component) {
    const btstyle = { margin: '8px 0' };
    let history = useHistory();

    const onLogout = async () => {
        history.push('/');
    };

    const handleLogout = async () => {
        await onLogout();
    };
    return (
        
        <div align="center">
            <h2>Non-Employee</h2>
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

export default withRouter(NonEmployeePage);