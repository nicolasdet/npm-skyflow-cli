'use strict';

const fs = require("fs"), resolve = require("path").resolve;

const Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    request = require('request');


class Api {

    constructor() {

        this.protocol = "http";
        this.host = "localhost:8080";

    }

    get(url, callback) {

        request(this.protocol + '://' + this.host + '/' + url.trim('/'), (error, response, body) => {

            response = {
                error: error,
                statusCode: response ? response.statusCode : null,
                body: (!error && response.statusCode === 200) ? JSON.parse(body) : null,
            };

            if (Helper.isFunction(callback)) {
                callback.apply(this, [response])
            }

        });

        return this
    }

    /**
     * Pull docker compose or package version.
     * @param type Can be 'compose' 'package'
     * @param value Can be 'adminer' 'symfony'
     * @param version Can be '4.0' 'latest'
     * @param callback
     * @returns {number}
     */
    getDockerComposeOrPackageVersion(type, value, version = 'latest', callback) {

        Output.writeln('Pulling ' + value + ' ' + type + ' version ' + version + ' from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('docker/' + type + '/' + value + '/' + version, (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull ' + value + ' ' + type + ' version ' + version + ' from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d)=>{

                let directory = resolve(Skyflow.getUserHome(), '.skyflow', d.directory);
                Directory.create(directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                if (Skyflow.isInux()) {fs.chmodSync(filename, '777')}

            });

            callback();

        });

        return 1

    }

    /**
     * Pull docker compose or package.
     * @param type Can be 'compose' 'package'
     * @param value Can be 'adminer' 'symfony'
     * @param callback
     * @returns {number}
     */
    getDockerComposeOrPackage(type, value, callback) {

        Output.writeln('Pulling ' + value + ' ' + type + ' from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('docker/' + type + '/' + value, (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull ' + value + ' ' + type + ' from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d)=>{

                let directory = resolve(Skyflow.getUserHome(), '.skyflow', d.directory);
                Directory.create(directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                if (Skyflow.isInux()) {fs.chmodSync(filename, '777')}

            });

            callback();

        });

        return 1

    }


}

module.exports = new Api();