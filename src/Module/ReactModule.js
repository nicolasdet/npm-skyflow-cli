'use strict';

const fs = require("fs"),
    path = require("path"),
    resolve = path.resolve,
    Directory = Skyflow.Directory,
    File = Skyflow.File,
    Shell = Skyflow.Shell,
    Helper = Skyflow.Helper,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require('lodash');

function runInfo(npmOrYarn) {

    Output.newLine();
    Output.writeln('Run:', false, false, 'bold');
    Output.newLine();
    Output.info(npmOrYarn + ' run dev', false);
    Output.writeln('Compile assets for development environment.');
    Output.newLine();
    Output.info(npmOrYarn + ' run build', false);
    Output.writeln('Compile assets for production environment.');
    Output.newLine();
    Output.info(npmOrYarn + ' run watch', false);
    Output.writeln('For watching assets.');

}

class ReactModule {

    // Require
    dispatcher() {

        let method = '__react__' + Object.values(arguments).join('__');

        let args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in React module.', false);

        return 1
    }

    __react__create__component(components) {

        if (!components[0]) {
            Output.error('Invalid component name.', false);
            process.exit(1);
        }

        let sampleDir = resolve(Helper.getUserHome(), '.skyflow', 'react', 'sample', 'component');

        function runAfterPull() {

            let dir = './';
            if (Request.hasOption('dir')) {
                dir = Request.getOption('dir')
            }

            dir = resolve(process.cwd(), dir);
            Directory.create(dir);

            components.map((name) => {

                name = _.upperFirst(_.camelCase(_.deburr(name)));

                let tmpDir = resolve(dir, name + 'Component');
                if (Directory.exists(tmpDir) && !Request.hasOption('force')) {
                    Output.error(name + ' component already exists. Use --force option to force creation.', false);
                    return 1;
                }

                let styleName = _.kebabCase(name);

                Directory.create(tmpDir);

                // Component file
                let contents = File.read(resolve(sampleDir, 'component.jsx.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                let filename = resolve(tmpDir, name + 'Component.jsx');
                File.create(filename, contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filename, '777')
                }

                // Style file
                contents = File.read(resolve(sampleDir, 'component.scss.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                filename = resolve(tmpDir, name + 'Component.scss');
                File.create(filename, contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filename, '777')
                }

                // Event file
                contents = File.read(resolve(sampleDir, 'componentEvent.js.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                filename = resolve(tmpDir, name + 'ComponentEvent.js');
                File.create(filename, contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filename, '777')
                }

                Output.success(name + 'Component');

            });

        }

        if (Directory.exists(sampleDir)) {
            runAfterPull()
        } else {
            Api.getReactComponentSamples(runAfterPull);
        }

        return 0
    }

    __react__create__container(containers) {

        if (!containers[0]) {
            Output.error('Invalid container name.', false);
            process.exit(1);
        }

        let sampleDir = resolve(Helper.getUserHome(), '.skyflow', 'react', 'sample', 'container');

        function runAfterPull() {

            let dir = './';
            if (Request.hasOption('dir')) {
                dir = Request.getOption('dir')
            }

            dir = resolve(process.cwd(), dir);
            Directory.create(dir);

            containers.map((name) => {

                name = _.upperFirst(_.camelCase(_.deburr(name)));

                let tmpDir = resolve(dir, name + 'Container');
                if (Directory.exists(tmpDir) && !Request.hasOption('force')) {
                    Output.error(name + ' container already exists. Use --force option to force creation.', false);
                    return 1;
                }

                let styleName = _.kebabCase(name);

                Directory.create(tmpDir);

                // Component file
                let contents = File.read(resolve(sampleDir, 'container.jsx.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                let filename = resolve(tmpDir, name + 'Container.jsx');
                File.create(filename, contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filename, '777')
                }

                // Style file
                contents = File.read(resolve(sampleDir, 'container.scss.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                filename = resolve(tmpDir, name + 'Container.scss');
                File.create(filename, contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filename, '777')
                }

                Output.success(name + 'Container');

            });

        }

        if (Directory.exists(sampleDir)) {
            runAfterPull()
        } else {
            Api.getReactContainerSamples(runAfterPull);
        }

        return 0
    }

    __react__install() {

        let installDir = resolve(Helper.getUserHome(), '.skyflow', 'react', 'install');

        function runAfterPull() {

            Directory.copy(installDir, resolve(process.cwd()));

            let files = require(resolve(installDir, 'install.js'));

            files.map((file) => {

                let currentDir = resolve(process.cwd(), file.directory);
                Directory.create(currentDir);
                let filePath = resolve(currentDir, file.filename);
                File.create(filePath, file.contents);
                if (Helper.isInux()) {
                    fs.chmodSync(filePath, '777')
                }
                Output.success(_.trimStart(file.directory + path.sep + file.filename, '/'));

            });

            if (File.exists(resolve(process.cwd(), 'install.js'))) {
                File.remove(resolve(process.cwd(), 'install.js'));
            }

            // Try to run yarn

            Output.writeln('Checking yarn ...');
            Shell.run('yarn', ['-v']);
            if(!Shell.hasError()){
                Output.writeln('Installing dependencies ...');
                Shell.exec('yarn');
                runInfo('yarn');
                return 0
            }
            Output.info('yarn not found.', false);

            // Try to run npm

            Output.writeln('Checking npm ...');
            Shell.run('npm', ['-v']);
            if(!Shell.hasError()){
                Output.writeln('Installing dependencies ...');
                Shell.exec('npm install');
                runInfo('npm');
                return 0
            }
            Output.info('npm not found.', false);

            Output.error('Can not install dependencies. Yarn or npm not found.', false);

        }

        if (Directory.exists(installDir)) {
            runAfterPull()
        } else {
            Api.getReactInstallFiles(runAfterPull);
        }

        return 0
    }


}

module.exports = new ReactModule();