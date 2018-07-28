'use strict';

const resolve = require('path').resolve,
    fs = require('fs');

const File = Skyflow.File,
    Api = Skyflow.Api,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Request = Skyflow.Request,
    Output = Skyflow.Output;

const ComposeModule = require('./ComposeModule');

function getPackage(pkg, version = null) {

    let pkgDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'package', pkg, version);

    if (!Directory.exists(pkgDir)) {
        return 1
    }

    if (File.exists(resolve(pkgDir, pkg + '.yml'))) {

        let pkgContent = File.read(resolve(pkgDir, pkg + '.yml'));

        pkgContent.replace(/{% ?([a-z0-9_\-]+(:?\:[a-z0-9\.]+)?) ?%}/g, (m, compose) => {

            compose = compose.split(':');

            if (!compose[1]) {
                compose[1] = 'latest';
            }

            Api.pullElement('compose', compose[0], () => {
                Request.setOption('v', 'v' + compose[1]);
                ComposeModule['__compose__add'].apply(ComposeModule, [[compose[0]]]);
            });

        });

    }

    return 0
}

function listPackage() {

    let list = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'package', 'list.js');

    function displayPackageList() {

        list = require(list);

        Output.newLine();
        Output.writeln('Available package:', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        for (let name in list) {
            if (!list.hasOwnProperty(name)) {
                continue;
            }
            Output.write(name, null, null, 'bold');
            Output.writeln(' -> package:add ' + name.toLowerCase());
            Output.writeln(list[name], 'gray')

        }

    }

    if (!File.exists(list)) {

        Output.writeln("Pulling package list from " + Api.protocol + '://' + Api.host + " ...", false);

        Api.get('list/docker/package', (response) => {

            if (response.statusCode !== 200) {
                Output.error("Can not pull package list.", false);
                process.exit(1)
            }

            let dest = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'package');
            Directory.create(dest);

            File.create(resolve(dest, 'list.js'), response.body.list);
            delete response.body.list;

            if (Skyflow.isInux()) {
                fs.chmodSync(resolve(dest, 'list.js'), '777')
            }

            displayPackageList()

        });

        return 0
    }

    displayPackageList();

    return 0
}

class PackageModule {

    // Require
    dispatcher(container, command) {

        if (command === undefined) {
            command = container;
            container = null
        }

        let options = process.argv.slice(3);

        if (container === null) {

            let c = "__package__" + command;

            if (this[c]) {
                return this[c](options);
            }

        } else {

            let c = "__" + command;

            if (this[c]) {
                return this[c](container, options);
            }

        }

        Output.error('Command ' + command + ' not found in Package module.', false);

        return 1
    }

    package() {

        if (Request.hasOption("list")) {
            return listPackage();
        }

        return 1
    }

    __package__add(packages) {

        if (!packages[0]) {
            Output.error("Missing argument.", false);
            process.exit(1)
        }

        let pkg = packages[0],
            packageDir = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'package', pkg);

        function runAfterPull() {

            let versions = Directory.read(packageDir, {directory: true, file: false});

            // Choices
            Input.choices(
                {
                    message: 'Choose ' + pkg + ' version',
                },
                versions,
                answer => {
                    getPackage(pkg, answer.response)
                }
            );

        }

        if (Directory.exists(packageDir)) {
            runAfterPull()
        } else {
            Api.pullElement('package', pkg, runAfterPull);
        }

        return 0
    }

}

module.exports = new PackageModule();