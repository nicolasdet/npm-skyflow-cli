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

            Api.getDockerComposeOrPackageVersion('compose', compose[0], compose[1], () => {
                Request.setOption('v', compose[1]);
                ComposeModule['__compose__add'].apply(ComposeModule, [[compose[0]]]);
            });

        });

    }

    return 0
}

function listPackage() {

    let pkgListFileName = resolve(Skyflow.getUserHome(), '.skyflow', 'docker', 'package.list.js');

    function displayComposeList() {

        let composes = require(pkgListFileName);

        Output.newLine();
        Output.writeln('Available compose:', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        composes.map((compose)=>{

            Output.write(compose.name, null, null, 'bold');
            Output.writeln(' >>> package:add ' + compose.name.toLowerCase());

            Output.write('Versions [ ', 'gray', null);
            let versions = compose.versions.sort();
            versions.map((version)=>{
                Output.write(version + ' ', 'gray', null);
            });

            Output.writeln(']', 'gray');

            Output.writeln(compose.description, 'gray')

        });

    }

    if (!File.exists(pkgListFileName)) {

        Output.writeln('Pulling package list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('docker/package', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull package list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                packages = [];

            data.map((d)=>{

                let directory = resolve(Skyflow.getUserHome(), '.skyflow', d.directory);
                Directory.create(directory);
                let configFile = resolve(directory, d.pkg + '.config.js');

                File.create(configFile, d.contents);
                if (Skyflow.isInux()) {fs.chmodSync(configFile, '777')}

                let pkg = require(configFile);
                pkg['versions'] = d.versions;
                packages.push(pkg);

                Directory.delete(directory);

            });

            File.create(pkgListFileName, "'use strict';\n\nmodule.exports = "+JSON.stringify(packages));
            if (Skyflow.isInux()) {fs.chmodSync(pkgListFileName, '777')}

            displayComposeList()

        });

        return 0
    }

    displayComposeList();

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
                return this[c].apply(this, [options]);
            }

        } else {

            let c = "__" + command;

            if (this[c]) {
                return this[c].apply(this, [container, options]);
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

        let version = null;

        if(Request.hasOption('v')){
            version = Request.getOption('v');
            packageDir = resolve(packageDir, version);
        }

        function runAfterPull() {

            if(version){
                return getPackage(pkg, version)
            }

            let versions = Directory.read(packageDir, {directory: true, file: false});

            // Choices
            Input.choices(
                {
                    message: 'Choose ' + pkg + ' package version',
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
            if(version){
                Api.getDockerComposeOrPackageVersion('package', pkg, version, runAfterPull);
            }else {
                Api.getDockerComposeOrPackage('package', pkg, runAfterPull);
            }
        }

        return 0
    }

}

module.exports = new PackageModule();