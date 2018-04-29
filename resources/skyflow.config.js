'use strict';

const resolve = require('path').resolve;

module.exports = {

    commands: {
        // commandName: {
        //     description: "Description of command",
        //     options: {
        //         option1: "Description of option",
        //         option2: "Description of option",
        //     },
        //     since: "1.0.0",
        //     callback: ()=>{
        //         console.log(this);
        //     }
        // }
    },

    container: {
        invokable: {
            // Use invoke method for this array
            // Stores only callable functions
        },
        service: {
            // Use get method for this array
        }
    }

};