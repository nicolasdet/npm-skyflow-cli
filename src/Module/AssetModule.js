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
    _ = require('lodash'),
    shx = require('shelljs');

function replaceOutputDirectory(){

    let values = Skyflow.getComposeValues('asset'),
        file = resolve(Skyflow.getCurrentAssetDir(), 'webpack', 'webpack.config.dev.js'),
        content = File.read(file + '.dist');
    content = content.replace(/\{\{ ?output_directory ?\}\}/g, values['output_directory']);
    File.create(file, content);

    file = resolve(Skyflow.getCurrentAssetDir(), 'webpack', 'webpack.config.prod.js');
    content = File.read(file + '.dist');
    content = content.replace(/\{\{ ?output_directory ?\}\}/g, values['output_directory']);
    File.create(file, content)
}

function runInfo() {

    Output.newLine();
    Output.writeln('Run:', false, false, 'bold');
    Output.newLine();
    Output.info("skyflow asset:compile", false);
    Output.writeln('Compile assets for development environment.');
    Output.newLine();
    Output.info("skyflow asset:build", false);
    Output.writeln('Compile assets for production environment.');
    Output.newLine();
    Output.info("skyflow asset:watch", false);
    Output.writeln('For watching assets.');

}

Skyflow.getCurrentAssetDir = () => {
    let currentAssetDir = 'assets';
    Directory.create(currentAssetDir);
    return currentAssetDir;
};

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

        let assetDir = resolve(Helper.getUserHome(), '.skyflow', 'asset');
        let assetFile = resolve(assetDir, 'asset.json');

        function runAfterPull() {

            let currentAssetDir = Skyflow.getCurrentAssetDir();

            Directory.copy(assetDir, resolve(currentAssetDir));

            let files = require(resolve(assetDir, 'asset.json'));

            files.map((file) => {

                let currentDir = resolve(currentAssetDir, file.directory);
                Directory.create(currentDir);
                let filePath = resolve(currentDir, file.filename);
                File.create(filePath, file.contents);
                shx.chmod(777, filePath);
                Output.success(_.trimStart(file.directory + path.sep + file.filename, '/'));

            });

            if (File.exists(resolve(currentAssetDir, 'asset.json'))) {
                File.remove(resolve(currentAssetDir, 'asset.json'));
            }

            Shell.exec("skyflow compose:add asset -v latest");
            Shell.exec("skyflow compose:update asset");

            // Replace output directory
            replaceOutputDirectory();

            // Install dependencies
            Shell.exec("skyflow compose:asset:run yarn");

            runInfo();
        }

        if (File.exists(assetFile)) {
            runAfterPull()
        } else {
            Api.getAssetsFiles(runAfterPull);
        }

        return 0
    }

    __asset__update() {
        Shell.exec("skyflow compose:update asset");

        // Replace output directory
        replaceOutputDirectory();

        // Update dependencies
        Shell.exec("skyflow compose:asset:run yarn");

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

    __asset__invalidate() {
        let assetDir = resolve(Helper.getUserHome(), '.skyflow', 'asset');
        Directory.remove(assetDir);
        Output.success('Asset cache has been successfully removed.');
    }

}

module.exports = new AssetModule();