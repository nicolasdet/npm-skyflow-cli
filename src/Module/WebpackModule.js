'use strict';

const fs = require('fs'),
    resolve = require('path').resolve,
    File = Skyflow.File,
    // Helper = Skyflow.Helper,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Output = Skyflow.Output,
    Validator = Skyflow.Validator;
let CurrentPackage = Skyflow.CurrentPackage;

let InputValidator = new Validator(/[\w]+/, 'This value is required.');
let ScriptValidator = new Validator(/^[a-z][a-z0-9]*\-?[a-z0-9]+$/i, 'Invalid script name.');

function installDependencies() {

    let devDependencies = [
        "clean-webpack-plugin@^0.1.19",
        "css-loader@^0.28.11",
        "extract-text-webpack-plugin@^4.0.0-beta.0",
        "file-loader@^1.1.11",
        "html-webpack-plugin@^3.2.0",
        "node-sass@^4.8.3",
        "sass-loader@^6.0.7",
        "style-loader@^0.20.3",
        "webpack@^4.3.0",
        "webpack-cli@^2.0.13"
    ];
    devDependencies = devDependencies.sort();
    let dependencies = [
        "@babel/core@^7.0.0-beta.42",
        "@babel/preset-env@^7.0.0-beta.42",
        "@babel/preset-react@^7.0.0-beta.42",
        "babel-loader@^8.0.0-beta.2",
        "react@^16.2.0",
        "react-dom@^16.2.0",
        "skyflow-core"
    ];
    dependencies = dependencies.sort();
    const {execSync} = require('child_process');
    // Install dependencies
    Output.newLine();
    Output.info('Installing dependencies...', false); Output.newLine();
    execSync('yarn add ' + dependencies.join(' '), {stdio:[0,1,2]});
    // Install dependencies
    Output.newLine();
    Output.info('Installing dev dependencies...', false); Output.newLine();
    execSync('yarn add ' + devDependencies.join(' ') + ' --dev', {stdio:[0,1,2]});

}

function installWebpack() {

    CurrentPackage = require(resolve(process.cwd(), 'package.json'));
    if(!CurrentPackage['scripts']){
        CurrentPackage['scripts'] = {};
    }
    Skyflow.CurrentPackage = CurrentPackage;

    let devScriptName = null,
        prodScriptName = null,
        watchScriptName = null,
        content = File.read(resolve(__dirname, '..', '..', 'resources', 'webpack', 'webpack.config.dev')),
        prodContent = File.read(resolve(__dirname, '..', '..', 'resources', 'webpack', 'webpack.config.prod'));

    const questions = [
        {
            message: 'Output directory',
            default: 'dist',
            validator: (response)=>{
                if (!InputValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                content = content.replace('{{output-dir}}', response);
                prodContent = prodContent.replace('{{output-dir}}', response);
                content = content.replace('{{output-dir}}', response);
                prodContent = prodContent.replace('{{output-dir}}', response);
                return true
            }
        },
        {
            message: 'JavaScript output file name',
            default: 'app.js',
            validator: (response)=>{
                if (!InputValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                content = content.replace('{{js-output}}', response);
                prodContent = prodContent.replace('{{js-output}}', response);
                return true
            }
        },
        {
            message: 'Style output file name',
            default: 'app.css',
            validator: (response)=>{
                if (!InputValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                content = content.replace('{{style-output}}', response);
                prodContent = prodContent.replace('{{style-output}}', response);
                return true
            }
        },
        {
            message: 'Development script name',
            default: 'dev',
            validator: (response)=>{
                if (!ScriptValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                if(CurrentPackage['scripts'][response]){
                    return "Script name already exists."
                }
                devScriptName = response;
                return true
            }
        },
        {
            message: 'Production script name',
            default: 'build',
            validator: (response)=>{
                if (!ScriptValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                if(CurrentPackage['scripts'][response]){
                    return "Script name already exists."
                }
                prodScriptName = response;
                return true
            }
        },
        {
            message: 'Watch script name',
            default: 'watch',
            validator: (response)=>{
                if (!ScriptValidator.isValid(response)) {
                    return InputValidator.getErrorMessage()
                }
                if(CurrentPackage['scripts'][response]){
                    return "Script name already exists."
                }
                watchScriptName = response;
                return true
            }
        },
    ];

    Input.input(questions, ()=>{

        let dir = resolve(process.cwd(), 'webpack');

        if (!Directory.exists(dir)) {Directory.create(dir)}

        // Create webpack/webpack.bootstrap.js file
        if(!File.exists(resolve(dir, 'webpack.bootstrap.js'))){
            File.copy(resolve(__dirname, '..', '..', 'resources', 'webpack', 'webpack.bootstrap'), resolve(dir, 'webpack.bootstrap.js'));
        }

        // Create webpack/webpack.config.dev.js file
        let configFile = resolve(dir, 'webpack.config.dev.js');
        File.create(configFile);
        if(Skyflow.isInux()){
            fs.chmodSync(configFile, '777');
        }
        File.write(configFile, content);

        // Create webpack/webpack.config.prod.js file
        let prodConfigFile = resolve(dir, 'webpack.config.prod.js');
        File.create(prodConfigFile);
        if(Skyflow.isInux()){
            fs.chmodSync(prodConfigFile, '777');
        }
        File.write(prodConfigFile, prodContent);

        CurrentPackage['scripts'][devScriptName] = "./node_modules/.bin/webpack" +
            " --mode=development --config=webpack/webpack.config.dev.js";
        CurrentPackage['scripts'][prodScriptName] = "./node_modules/.bin/webpack" +
            " --mode=production --config=webpack/webpack.config.prod.js";
        CurrentPackage['scripts'][watchScriptName] = "./node_modules/.bin/webpack --mode=development" +
            " --config=webpack/webpack.config.dev.js --watch";

        File.createJson(resolve(process.cwd(), 'package.json'), CurrentPackage);

        installDependencies();

        Output.newLine();

        Output.success('Success !', false);

        Output.newLine();
        Output.write('yarn run ' + devScriptName);
        Output.success(' ✓', false);

        // Output.newLine();
        Output.write('yarn run ' + prodScriptName);
        Output.success(' ✓', false);

        // Output.newLine();
        Output.write('yarn run ' + watchScriptName);
        Output.success(' ✓', false);

    })

}

class WebpackModule {

    getDescription() {
        return 'With this module, you can quickly start a project with webpack.'
    }

    install(options) {

        if (!File.exists(resolve(process.cwd(), 'package.json'))) {
            const {exec} = require('child_process');
            exec('yarn init -y', {stdio:[0,1,2]}, (error, stdout, stderr)=>{
                if(error){
                    Output.error(error, false);
                    process.exit(1);
                }
                installWebpack();
            });
        }else {
            installWebpack();
        }

    }

}

module.exports = new WebpackModule();