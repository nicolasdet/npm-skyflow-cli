"use strict";

const resolve = require("path").resolve,
    Shell = Skyflow.Shell,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require('lodash');

Skyflow.getCurrentDockerDir = () => {
    let currentDockerDir = "docker";
    return currentDockerDir;
};

class SymfonyModule {
    // Require
    dispatcher(command) {
        Shell.run("docker", ["-v"]);
        if (Shell.hasError()) {
            Output.error(
                "Docker does not respond. Check if it is installed and running.",
                false
            );
            return 1;
        }

        Shell.run("docker-compose", ["-v"]);
        if (Shell.hasError()) {
            Output.error(
                "Docker-compose does not respond. Check if it is installed and running.",
                false
            );
            return 1;
        }

        let method = '__symfony__' + Object.values(arguments).join('__');

        let args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in Symfony module.', false);
    }

    __symfony__help(args) {
        Shell.exec("skyflow C:symfony:exec php bin/console");
    }

    __symfony__dump__routes() {
        Shell.exec("skyflow C:symfony:exec php bin/console debug:router");
    }

    __symfony__make(args) {
        Shell.run("skyflow", ["C:symfony:exec", "php", "bin/console", "make:", args[0]]);
        if (Shell.hasError()) {
            Output.error(Shell.arrayResult, false);
            return 1;
        }
    }
}

module.exports = new SymfonyModule();
