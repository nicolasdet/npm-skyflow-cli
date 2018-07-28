'use strict';

const fs = require("fs"), resolve = require("path").resolve;

const Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
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


    /**
     * Pull element
     * @param type Can be 'compose' 'package'
     * @param value Can be 'adminer' 'symfony'
     * @param callback
     * @returns {number}
     */
    pullElement(type, value, callback) {

        Output.writeln("Pulling " + value + " compose from " + this.protocol + '://' + this.host + " ...", false);

        this.get('docker/' + type + '/' + value, (response) => {

            if (response.statusCode !== 200) {
                Output.error(value + " compose not found.", false);
                return 1
            }

            response.body[type].forEach((c) => {

                let dest = resolve(Skyflow.getUserHome(), '.skyflow', ...c.directory);

                Directory.create(dest);

                File.create(resolve(dest, c.file), c.content);
                if (Skyflow.isInux()) {
                    fs.chmodSync(resolve(dest, c.file), '777')
                }

            });

            callback();

        });

        return 1

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