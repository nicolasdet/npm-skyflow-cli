module.exports = {

    "-v|--version": {
        description: "Display current CLI version.",
        options: {
            '-f, --force': "Force removal of the image.",
            '--no-prune': 'Do not delete untagged parents'
        },
        author: "Skyflow"

    },

    "-h|--help": {
        description: "Display help for CLI.",
        options: {
            '-f, --force': "Force removal of the image.",
            '--no-prune': 'Do not delete untagged parents'
        },
        author: "Skyflow"

    },


};