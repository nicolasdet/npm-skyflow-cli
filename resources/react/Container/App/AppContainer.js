import React from 'react';
import ReactDOM from 'react-dom';
import './AppContainer.scss';

class AppContainer extends React.Component {

    render(){
        return (
            <div id="app-container">
                <h1>React skeleton is ready !</h1>
            </div>
        )
    }
}

ReactDOM.render(
    <AppContainer/>,
    document.querySelector('body')
);