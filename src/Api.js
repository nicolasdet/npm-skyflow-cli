'use strict';

const Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    request = require('request');


class Api {

    constructor(){

        this.events ={
            success: null,
            error: null,
        };

        this.protocol = "https";
        this.host = "api.skyflow.io";

    }

    get(url, callback){
        
        request(this.protocol + '://'+this.host + '/' + url.trim('/'), (error, response, body)=>{

            response = {
                error : error,
                statusCode: response ? response.statusCode : null,
                body: (response.statusCode === 200) ? JSON.parse(body) : null,
            };

            if(Helper.isFunction(callback)){
                callback.apply(this, [response])
            }

        });

        return this
    }

    post(){

    }

    put(){

    }

    delete(){

    }

    on(event, callback){

        if(this.events.hasOwnProperty(event) && Helper.isFunction(callback)){
            this.events[event] = callback
        }

        return this
    }


}

module.exports = new Api();