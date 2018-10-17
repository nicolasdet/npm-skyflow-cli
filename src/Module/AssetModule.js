'use strict';

const path = require("path"),
    resolve = path.resolve,
    File = Skyflow.File,
    Directory = Skyflow.Directory,
    Shell = Skyflow.Shell,
    Helper = Skyflow.Helper,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output,
    _ = require('lodash');

const ReactModule = require('./ReactModule.js');

function runInfo() {

    Output.newLine();
    Output.writeln('Run:', false, false, 'bold');
    Output.newLine();
    Output.success("skyflow asset:compile", false);
    Output.writeln('Compile assets for development environment.');
    Output.newLine();
    Output.success("skyflow asset:build", false);
    Output.writeln('Compile assets for production environment.');
    Output.newLine();
    Output.success("skyflow asset:watch", false);
    Output.writeln('For watching assets.');
    Output.newLine();

}

function listScript() {

    let scriptListFileName = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script', 'script.list.js');

    function displayStyleList() {

        let scripts = require(scriptListFileName);

        Output.newLine();
        Output.writeln('Available scripts', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        scripts.map((script) => {

            Output.write(script, null, null, 'bold');
            Output.write(' >>> ');
            Output.writeln('skyflow asset:add:script ' + script, 'green', null);

        });

    }

    if (!File.exists(scriptListFileName)) {

        Output.writeln('Pulling scripts list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('scripts/doc', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull scripts list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                scripts = [];

            Shell.mkdir('-p', resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script'));

            data.map((d) => {
                scripts.push(d.filename.replace(/\.json$/g, ''));
            });

            File.create(scriptListFileName, "'use strict';\n\nmodule.exports = " + JSON.stringify(scripts));
            Shell.chmod(777, scriptListFileName);

            displayStyleList()

        });

        return 0
    }

    displayStyleList();

    return 0
}

function listStyle() {

    let styleListFileName = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style', 'style.list.js');

    function displayStyleList() {

        let styles = require(styleListFileName);

        Output.newLine();
        Output.writeln('Available styles', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        styles.map((style) => {

            Output.write(style, null, null, 'bold');
            Output.write(' >>> ');
            Output.writeln('skyflow asset:add:style ' + style, 'green', null);

        });

    }

    if (!File.exists(styleListFileName)) {

        Output.writeln('Pulling styles list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('styles/doc', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull styles list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                styles = [];

            Shell.mkdir('-p', resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style'));

            data.map((d) => {
                styles.push(d.filename.replace(/\.json$/g, ''));
            });

            File.create(styleListFileName, "'use strict';\n\nmodule.exports = " + JSON.stringify(styles));
            Shell.chmod(777, styleListFileName);

            displayStyleList()

        });

        return 0
    }

    displayStyleList();

    return 0
}

class AssetModule {

    // Require
    dispatcher() {

        let method = '__asset__' + Object.values(arguments).join('__');

        let args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in Asset module.', false);

        return 1
    }

    __asset__install() {

        let assetDir = resolve(Helper.getUserHome(), '.skyflow', 'asset', 'base');

        function runAfterPull() {

            let currentAssetDir = Skyflow.getCurrentAssetDir();

            Directory.copy(assetDir, resolve(currentAssetDir));

            try{
                Shell.exec("skyflow compose:add asset -v latest");
            }catch (e) {
                Output.error(e.message, false)
            }
        }

        if (Directory.exists(assetDir)) {
            runAfterPull()
        } else {
            Api.getAssetsFiles(runAfterPull);
        }

        return 0
    }

    __asset__react__install() {
        let assetDir = resolve(Helper.getUserHome(), '.skyflow', 'asset', 'react');

        function runAfterPull() {

            let currentAssetDir = Skyflow.getCurrentAssetDir();

            Directory.copy(assetDir, resolve(currentAssetDir));

            try{
                Shell.exec("skyflow compose:add asset -v latest");
            }catch (e) {
                Output.error(e.message, false)
            }
        }

        if (Directory.exists(assetDir)) {
            runAfterPull()
        } else {
            Api.getAssetsFiles(runAfterPull);
        }

        return 0
    }

    __asset__update() {
        Shell.exec("skyflow compose:update asset");

        // Update dependencies
        Shell.exec("skyflow compose:asset:run \"yarn\"");

        runInfo();
    }

    __asset__compile() {
        Shell.exec("skyflow compose:asset:run \"yarn run compile\"");
    }

    __asset__build() {
        Shell.exec("skyflow compose:asset:run \"yarn run build\"");
    }

    __asset__watch() {
        Shell.exec("skyflow compose:asset:run \"yarn run watch\"");
    }

    __asset__sh() {
        Shell.exec("skyflow compose:asset:run \"sh\"");
    }

    __asset__run() {
        Shell.exec("skyflow compose:asset:run \""+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__add() {
        Shell.exec("skyflow compose:asset:run \"yarn add "+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__remove() {
        Shell.exec("skyflow compose:asset:run \"yarn remove "+(Object.values(arguments).join(' '))+"\"");
    }

    __asset__script() {

        if (Request.hasOption("list") || !Request.hasOption()) {
            return listScript()
        }

        return 1
    }

    __asset__style() {

        if (Request.hasOption("list") || !Request.hasOption()) {
            return listStyle()
        }

        return 1
    }

    __asset__add__script(scripts) {

        if (!scripts[0]) {
            Output.error('Invalid script name.', false);
            process.exit(1);
        }

        let scriptDir = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'script');

        function runAfterPull(name) {

            name = _.lowerFirst(name);

            if (!File.exists(resolve(scriptDir, name + '.js'))) {
                Output.error(name + ' script not found.', false);
                return 1
            }

            let outputInfoDir = Skyflow.getCurrentAssetDir() + path.sep + 'scripts',
                dir = resolve(outputInfoDir);
            if (Request.hasOption('dir')) {
                outputInfoDir = Skyflow.getCurrentAssetDir() + path.sep + _.trim(Request.getOption('dir'), '/');
                dir = resolve(outputInfoDir)
            }

            dir = resolve(process.cwd(), dir);
            Shell.mkdir('-p', dir);

            name += '.js';

            if (File.exists(resolve(dir, name))) {
                Output.info(outputInfoDir + path.sep + name + ' already exists.', false);
                return 1
            }

            File.copy(resolve(scriptDir, name), resolve(dir, name));
            Shell.chmod(777, resolve(dir, name));

            Output.success(name);
        }

        scripts.map((name) => {

            if (File.exists(resolve(scriptDir, name + '.js'))) {
                runAfterPull(name)
            } else {
                Api.getScriptByName(name, runAfterPull);
            }

        });

        return 0
    }

    __asset__add__style(styles) {

        if (!styles[0]) {
            Output.error('Invalid style name.', false);
            process.exit(1);
        }

        let styleDir = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style');

        function runAfterPull(name) {

            if (!File.exists(resolve(styleDir, '_' + name + '.scss'))) {
                Output.error(name + ' style not found.', false);
                return 1
            }

            let outputInfoDir = Skyflow.getCurrentAssetDir() + path.sep + 'styles',
                dir = resolve(outputInfoDir);
            if (Request.hasOption('dir')) {
                outputInfoDir = Skyflow.getCurrentAssetDir() + path.sep + _.trim(Request.getOption('dir'), '/');
                dir = resolve(outputInfoDir)
            }

            dir = resolve(process.cwd(), dir);
            Shell.mkdir('-p', dir);

            name = '_' + name + '.scss';

            if (File.exists(resolve(dir, name))) {
                Output.info(outputInfoDir + path.sep + name + ' already exists.', false);
                return 1
            }

            File.copy(resolve(styleDir, name), resolve(dir, name));
            Shell.chmod(777, resolve(dir, name));

            Output.success(name);
        }

        styles.push('variables');

        styles.map((name) => {

            if (File.exists(resolve(styleDir, '_' + name + '.scss'))) {
                runAfterPull(name)
            } else {
                Api.getStyleByName(name, runAfterPull);
            }

        });

        return 0
    }

    __asset__invalidate() {
        Shell.rm('-rf', resolve(Helper.getUserHome(), '.skyflow', 'asset'));
        Shell.rm('-rf', resolve(Helper.getUserHome(), '.skyflow', 'script'));
        Shell.rm('-rf', resolve(Helper.getUserHome(), '.skyflow', 'style'));
        Output.success('Asset cache has been successfully removed.');
    }

    __asset__create__component(components) {
        if (!Request.hasOption('dir')) {
            Request.addOption('dir', resolve(Skyflow.getCurrentAssetDir(), 'src', 'Component'))
        }

        return ReactModule['__react__create__component'](components)
    }

    __asset__create__container(containers) {
        if (!Request.hasOption('dir')) {
            Request.addOption('dir', resolve(Skyflow.getCurrentAssetDir(), 'src', 'Container'))
        }

        return ReactModule['__react__create__container'](containers)
    }

}

module.exports = new AssetModule();
