'use strict';

const {execSync, spawnSync, spawn} = require('child_process');

class Shell {

    constructor(){
        this.result = "";
        this.arrayResult = [];
        this.error = false;
    }

    run(command, options){

        let spawn = spawnSync(command + '', options);
        this.error = spawn.stderr.toString().trim();

        if (!this.error) {this.error = false}

        this.result = spawn.stdout.toString().trim();

        this.arrayResult = this.result.split("\n");

        if(this.arrayResult[0] === ''){
            this.arrayResult = [];
        }

        return this;
    }

    runAsync(command, options){
        let cmd = spawn(command + '', options);
        cmd.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        cmd.stderr.on('data', (data) => {
            Output.writeln(data);
            // console.log(`stdout: ${data}`);
        });

    }

    exec(command){
        execSync(command, {stdio: [process.stdin, process.stdout, process.stderr]});
    }

    hasError(){
        return this.error !== false;
    }

    getError(){
        return this.error;
    }

    getResult(){
        return this.result;
    }

    getArrayResult(){
        return this.arrayResult;
    }

}

module.exports = new Shell();