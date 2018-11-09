const Helper = Skyflow.Helper,
    Output = Skyflow.Output,
    File = Skyflow.File,
    Shell = Skyflow.Shell,
    {resolve} = require("path"),
    {request} = require('graphql-request');

class Api {

    constructor() {

        this.protocol = "http";
        this.host = "v2.skyflow.io";
        // this.host = "localhost:4000";

    }

    /**
     * Pull docker compose or package.
     * @param {string} type Can be 'compose' 'package'
     * @param {string} value Can be 'adminer' 'symfony'
     * @param {function} callback
     * @returns {number}
     */
    getDockerComposeOrPackage(type, value, callback) {

        Output.writeln("Pulling " + value + " " + type + " from " + this.protocol + "://" + this.host + " ...", false);

        const query = `{
            ${type}(name: ${value}){ ${type} directory filename contents }
        }`;

        request(this.protocol + "://" + this.host, query)
            .then(data => {
                let dir = resolve(Helper.getUserHome(), ".skyflow", "api", type, value);
                Shell.mkdir("-p", dir);
                data[type].map((file) => {
                    let directory = resolve(dir, file.directory);
                    Shell.mkdir("-p", directory);
                    let filename = resolve(directory, file.filename);
                    File.create(filename, file.contents);
                    // Shell.chmod(777, filename);

                });
                callback();
            })
            .catch(() => {
                Output.error("Can not pull " + value + " " + type + " from " + this.protocol + "://" + this.host, false);
            });

        return 1
    }

    /**
     * Pull docker compose or package documentation.
     * @param {string} type Can be 'compose' 'package'
     * @param {function} callback
     * @returns {number}
     */
    getDockerComposeOrPackageDoc(type, callback) {

        Output.writeln("Pulling " + type + "s documentation from " + this.protocol + "://" + this.host + " ...", false);

        const query = `{
            ${type}sDoc{
                name slug description logo
                author{ name }
            }
        }`;

        request(this.protocol + "://" + this.host, query)
            .then(data => {
                let dir = resolve(Helper.getUserHome(), ".skyflow", "doc");
                Shell.mkdir("-p", dir);
                let filename = resolve(dir, type + "s.json");
                File.create(filename, JSON.stringify(data[type + "sDoc"]));

                callback();
            })
            .catch(() => {
                Output.error("Can not pull " + type + "s documentation from " + this.protocol + '://' + this.host, false);
            });

        return 1
    }

    /**
     * Pull skyflow commands line documentation.
     * @param {function} callback
     * @returns {number}
     */
    getCommandsDoc(callback) {

        Output.writeln("Pulling commands documentation from " + this.protocol + "://" + this.host + " ...", false);

        const query = `{
            commandsDoc{
                module command alias description
                options{ name description }
                arguments { name description optional }
            }
        }`;

        request(this.protocol + "://" + this.host, query)
            .then(data => {
                let dir = resolve(Helper.getUserHome(), ".skyflow", "doc");
                Shell.mkdir("-p", dir);
                let filename = resolve(dir, "commands.json");
                File.create(filename, JSON.stringify(data["commandsDoc"]));

                callback();
            })
            .catch(() => {
                Output.error("Can not pull commands documentation from " + this.protocol + "://" + this.host, false);
            });

        return 1
    }

    /**
     * Pull skyflow modules documentation.
     * @param {function} callback
     * @returns {number}
     */
    getModulesDoc(callback) {

        Output.writeln("Pulling modules documentation from " + this.protocol + "://" + this.host + " ...", false);

        const query = `{
            modulesDoc{
                name slug alias description
                author { name }
            }
        }`;

        request(this.protocol + "://" + this.host, query)
            .then(data => {
                let dir = resolve(Helper.getUserHome(), ".skyflow", "doc");
                Shell.mkdir("-p", dir);
                let filename = resolve(dir, "modules.json");
                File.create(filename, JSON.stringify(data["modulesDoc"]));

                callback();
            })
            .catch((error) => {
                console.log(error);
                Output.error("Can not pull modules documentation from " + this.protocol + "://" + this.host, false);
            });

        return 1
    }

    /**
     * Pull assets files.
     * @param {string} type
     * @param {function}callback
     * @returns {number}
     */
    getAssetsFiles(type, callback) {

        Output.writeln("Pulling assets files from " + this.protocol + "://" + this.host + " ...", false);

        const query = `{
            asset(type: ${type}) {
                type
                directory
                filename
                contents
            }
        }`;

        request(this.protocol + "://" + this.host, query)
            .then(data => {
                let assetDir = resolve(Helper.getUserHome(), ".skyflow", "api", "asset", type);
                Shell.mkdir("-p", assetDir);
                data.asset.map((file) => {
                    let directory = resolve(assetDir, file.directory);
                    Shell.mkdir("-p", directory);
                    let filename = resolve(directory, file.filename);
                    File.create(filename, file.contents);
                    // Shell.chmod(777, filename);
                });
                callback();
            })
            .catch(() => {
                Output.error("Can not pull assets files from " + this.protocol + "://" + this.host, false);
            });

        return 1
    }

}

module.exports = new Api();