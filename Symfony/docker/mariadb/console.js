'use strict';

// mariadb

module.exports = {

    questions: [
        {
            message: "Database name",
            name: "database_name",
            default: "skyflow",
        },
        {
            message: "Database user",
            name: "user",
            default: "skyflow",
        },
        {
            message: "Database password",
            name: "password",
            default: "root",
        },
        {
            message: "Database root password",
            name: "root_password",
            default: "root",
        },
        {
            message: "Database storage location. Relative to the current directory.",
            name: "database_storage_location",
            default: "../.database/my_app",
        },
    ],

    messages: {
        writeln: [
            'Database information:',
            'Host: {{ container_name }}',
            'Database name: {{ database_name }}',
            'User: {{ user }}',
            'Password: {{ password }}',
            'Root password: {{ root_password }}',
        ],
    }


};
