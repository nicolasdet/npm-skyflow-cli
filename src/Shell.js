'use strict';

const {execSync, spawnSync, spawn} = require('child_process');

class Shell {

    constructor() {
        this.result = "";
        this.arrayResult = [];
        this.error = false;
        this.status = null;
    }

    run(command, options) {

        this.error = false;

        let spawn = spawnSync(command + '', options);

        this.status = spawn.status;

        if(spawn.status === null || spawn.status !== 0){
            this.error = spawn.error;
            return this;
        }

        this.result = spawn.stdout.toString().trim();
        this.arrayResult = this.result.split("\n");

        if (this.arrayResult[0] === '') {
            this.arrayResult = [];
        }

        return this;
    }

    runAsync(command, options) {
        let cmd = spawn(command + '', options);
        cmd.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        cmd.stderr.on('data', (data) => {
            Output.writeln(data);
            // console.log(`stdout: ${data}`);
        });

    }

    exec(command) {
        execSync(command, {stdio: [process.stdin, process.stdout, process.stderr]});
    }

    hasError() {
        return this.error !== false;
    }

    getError() {
        return this.error;
    }

    getResult() {
        return this.result;
    }

    getStatus() {
        return this.status;
    }

    getArrayResult() {
        return this.arrayResult;
    }

}

module.exports = new Shell();