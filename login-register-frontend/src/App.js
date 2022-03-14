import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Login from './components/login';
import EmployeePage from './components/employeePage'
import NonEmployeePage from './components/nonEmployeePage'
import Register from './components/register'

function App() {
    return (
        <Router>
            <div>
                <h1 align="center">Welcome to Presidio</h1>
                <div className="container">
                    <Route exact path="/" component={Login} />
                    <Route exact path="/employee" component={EmployeePage} />
                    <Route exact path="/visitor" component={NonEmployeePage} />
                    <Route exact path="/register" component={Register} />
                </div>
            </div>
        </Router>
    );
}

export default App;