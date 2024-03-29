import React from 'react';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import Login from './components/login';
import EmployeePage from './components/employeePage'
import NonEmployeePage from './components/nonEmployeePage'
import Register from './components/register'

function App() {
    //TODO: implement <Redirect to="/" /> with a href in login.js
    return (
        <Router>
            <div>
                <h1 align="center">Welcome to Presidio</h1>
                <div className="container">
                    <Route exact path="/" component={Login} />
                    <Route exact path="/employee" component={EmployeePage} />
                    <Route exact path="/visitor" component={NonEmployeePage} />
                    <Route exact path="/register" component={Register} />
                    <Redirect to="/" />
                </div>
            </div>
        </Router>
    );
}

export default App;