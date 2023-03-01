let shared = {
};

let users = [
    {
        _id: '1c1286e7-ef15-4d87-b695-f83a5437e323',
        name: 'Ali Faiz',
        password: '$2a$10$Hher/OwiLWQLsS3vHMICf.xbbp56/YHpiw0fLF12pGxSdXSC/dYYW',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxYzEyODZlNy1lZjE1LTRkODctYjY5NS1mODNhNTQzN2UzMjMiLCJpYXQiOjE2Nzc2MDYwNzcsImV4cCI6MTY3NzY5MjQ3N30.aHQTZs5stp_0S0PvCLNCt_catCLngaeSB7N4qCM5XBs'
    },
    {
        _id: '1c1286e7-ef15-4d87-b695-f83a5437e322',
        name: 'Asad Naeem',
        password: '$2a$10$Hher/OwiLWQLsS3vHMICf.xbbp56/YHpiw0fLF12pGxSdXSC/dYYX',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ0.eyJfaWQiOiIxYzEyODZlNy1lZjE1LTRkODctYjY5NS1mODNhNTQzN2UzMjMiLCJpYXQiOjE2Nzc1ODA4OTEsImV4cCI6MTY3NzY2NzI5MX0.LgwhqCVPUpiaDsz1W9OozlHqWlq_pNY3YBbPStBg3zE'
    }

];

let private_group_chats = [
    {
        _id: '21c3b5e1-f753-4104-bdd5-3dc8dfd4df8e',
        ids: ['1c1286e7-ef15-4d87-b695-f83a5437e323'],
        name: "Ali's Group",
        chatCode: '$2a$10$ujswjSwSZdTZMVH1Zx6/aeGSgljdmS2YHgaL/06hDEA7RfcJsBPHy'
    },
    {
        _id: 'a4ab3f8a-dc9c-4afe-a902-4b8ec3a12a89',
        ids: ['1c1286e7-ef15-4d87-b695-f83a5437e323'],
        name: 'S3 Demo Integration',
        chatCode: '$2a$10$XgjpYbtIWcaxVoLmKFbzOuYnV/63QFYZbaYSlpcL6Qo6TH5JEcFxy'
    }
];

module.exports = {
    shared,
    users,
    private_group_chats
}