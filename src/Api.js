'use strict';

const resolve = require("path").resolve;

const Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Shell = Skyflow.Shell,
    request = require('request');

class Api {

    constructor() {

        this.protocol = "https";
        this.host = "api.skyflow.io";
        // this.host = "localhost:8000";

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

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

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

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    /**
     * Pull docker compose configuration file.
     * @param compose Can be 'adminer' 'symfony'
     * @returns {number}
     */
    getDockerComposeConfig(compose) {

        Output.writeln('Pulling ' + compose + ' configuration file from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('docker/compose' + '/' + compose + '/config', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull ' + compose + ' configuration file from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

        });

        return 1
    }

    /**
     * Pull react component samples.
     * @param callback
     * @returns {number}
     */
    getReactComponentSamples(callback) {

        Output.writeln('Pulling react component samples from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('react/sample/component', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull react component samples from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    /**
     * Pull react container samples.
     * @param callback
     * @returns {number}
     */
    getReactContainerSamples(callback) {

        Output.writeln('Pulling react container samples from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('react/sample/container', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull react container samples from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    /**
     * Pull react install files.
     * @param callback
     * @returns {number}
     */
    getReactInstallFiles(callback) {

        Output.writeln('Pulling react install files from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('react/install', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull react install files from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            let installDir = resolve(Helper.getUserHome(), '.skyflow', 'react', 'install');
            Shell.mkdir('-p', installDir);
            let installFile = resolve(installDir, 'install.js');
            File.create(installFile, "'use strict';\n\nmodule.exports = " + JSON.stringify(data) + ';');
            Shell.chmod(777, installFile);

            callback();

        });

        return 1
    }

    /**
     * Pull assets files.
     * @param callback
     * @returns {number}
     */
    getAssetsFiles(callback) {

        Output.writeln('Pulling assets files from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('assets', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull assets files from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            let assetDir = resolve(Helper.getUserHome(), '.skyflow', 'asset');
            Shell.mkdir('-p', assetDir);

            data.map((d) => {

                let directory = resolve(assetDir, d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    /**
     * Pull style by name.
     * @param name
     * @param callback
     * @returns {number}
     */
    getStyleByName(name, callback) {

        Output.writeln('Pulling ' + name + ' style from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('style/' + name, (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull ' + name + ' style from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback(name);

        });

        return 1
    }

    /**
     * Pull script by name.
     * @param name
     * @param callback
     * @returns {number}
     */
    getScriptByName(name, callback) {

        Output.writeln('Pulling ' + name + ' script from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('script/' + name, (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull ' + name + ' script from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback(name);

        });

        return 1
    }

    /**
     * Pull module help file.
     * @param module
     * @param callback
     * @returns {number}
     */
    getModuleHelp(module, callback) {

        Output.writeln('Pulling help for ' + module + ' from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('help/' + module, (response) => {
            
            if (response.statusCode !== 200) {
                Output.error('Can not pull help for ' + module + ' from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    /**
     * Pull module alias file.
     * @param callback
     * @returns {number}
     */
    getModuleAlias(callback) {

        Output.writeln('Pulling module alias from ' + this.protocol + '://' + this.host + ' ...', false);

        this.get('alias/module', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull module alias from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            data.map((d) => {

                let directory = resolve(Helper.getUserHome(), '.skyflow', d.directory);
                Shell.mkdir('-p', directory);
                let filename = resolve(directory, d.filename);

                File.create(filename, d.contents);
                Shell.chmod(777, filename);

            });

            callback();

        });

        return 1
    }

    getCliCurrentVersion(callback) {

        this.get("cli-current-version", (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not check last version from ' + this.protocol + '://' + this.host + '.', false);
                return 1
            }

            if (response.body.status !== 200) {
                Output.error(response.body.error, false);
                return 1
            }

            let data = response.body.data;

            callback.apply(null, [data]);

        });

        return 1
    }

}

module.exports = new Api();