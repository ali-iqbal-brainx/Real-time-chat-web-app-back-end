let shared = {
    publicChatName: "Public Group",
    publicChatCode: "123456",
    chatCodeR1: 100000,
    chatCodeR2: 900000,
    passwordRegex: new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')
};

module.exports = {
    shared
}