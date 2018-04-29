const resolve = require('path').resolve, Style = require(resolve(__dirname, 'ConsoleStyle'));

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
        return this.write(message, color, bg, style)
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

    error(message) {
        return this.write('Skyflow error: ', 'red', null, 'bold').writeln(message, 'red');
    }

    success(message) {
        return this.write('✓ ', 'green', null, 'bold').writeln(message, 'green');
    }

    info(message) {
        return this.write('Skyflow info: ', 'blue', null, 'bold').writeln(message, 'blue');
    }

    warning(message) {
        return this.write('Skyflow warning: ', 'yellow', null, 'bold').writeln(message, 'yellow');
    }

}

module.exports = new ConsoleOutput();