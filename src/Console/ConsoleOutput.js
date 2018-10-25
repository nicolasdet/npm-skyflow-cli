const resolve = require('path').resolve,
    Style = require(resolve(__dirname, 'ConsoleStyle')),
    Progress = require('cli-progress');

class ConsoleOutput {

    /**
     * Write message
     * @param {string} message
     * @param {string} color
     * @param {string} bg
     * @param {string} style
     * @returns {ConsoleOutput}
     */
    write(message, color, bg, style) {
        Style.setColor(color).setBackground(bg).addStyle(style);
        process.stdout.write(Style.apply(message));
        return this
    }

    /**
     * Write message with new line
     * @param {string} message
     * @param {string} color
     * @param {string} bg
     * @param {string} style
     * @returns {ConsoleOutput}
     */
    writeln(message, color, bg, style) {
        return this.write(message, color, bg, style).newLine();
    }

    /**
     * Write message
     * @param {string} message
     * @param {string} color
     * @param {string} bg
     * @param {string} style
     * @returns {ConsoleOutput}
     */
    print(message, color, bg, style) {
        return this.write(message, color, bg, style);
    }

    /**
     * Write message with new line
     * @param {string} message
     * @param {string} color
     * @param {string} bg
     * @param {string} style
     * @returns {ConsoleOutput}
     */
    println(message, color, bg, style) {
        return this.print(message, color, bg, style).newLine();
    }

    /**
     * Write new line
     * @param {number} count
     * @returns {ConsoleOutput}
     */
    newLine(count = 1) {
        process.stdout.write(require("os").EOL.repeat(count));
        return this;
    }

    /**
     * Write space
     * @param {number} count
     * @returns {ConsoleOutput}
     */
    space(count = 1) {
        process.stdout.write(' '.repeat(count));
        return this;
    }

    error(message, title = true) {
        return this.write(title ? 'Skyflow error: ' : '', 'red', null, 'bold').writeln(message, 'red');
    }

    success(message, title = true) {
        return this.write(title ? '✓ ' : '', 'green', null, 'bold').writeln(message, 'green');
    }

    info(message, title = true) {
        return this.write(title ? 'Skyflow info: ' : '', 'blue', null, 'bold').writeln(message, 'blue');
    }

    warning(message, title = true) {
        return this.write(title ? 'Skyflow warning: ' : '', 'yellow', null, 'bold').writeln(message, 'yellow');
    }

    /**
     * Start new progress bar.
     * @param totalValue
     * @param startValue
     * @link https://www.npmjs.com/package/cli-progress
     */
    progress(totalValue, startValue = 0) {
        let P = new Progress.Bar({
            format: '{bar} {percentage}% | {eta}s | {value}/{total}',
            stream: process.stdout
        }, Progress.Presets.shades_classic);
        P.start(totalValue, startValue);
        return P;
    }

}

module.exports = new ConsoleOutput();