module.exports = {

    'package': {
        description: "Manage packages.",
        options: {
            '--list': "List package can be used.",
        }
    },
    'package:add <package>': {
        description: "Add project package.",
        options: {
            '-v <version>': 'Version of package.',
        }
    },
    'package:update [<compose1> <compose2> ...]': {
        description: "Update docker-compose.yml using local files.",
    },

};