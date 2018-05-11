import React from 'react';
import ReactDOM from 'react-dom';
import Event from './AppContainerEvent';
import './AppContainer.scss';

class AppContainer extends React.Component {

    render(){
        return (
            <div>
                <h1>React skeleton is ready !</h1>
            </div>
        )
    }
}

ReactDOM.render(
    <AppContainer/>,
    document.querySelector('#app-container')
);