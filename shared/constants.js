chatType = {
    oneToOne: "ONE_TO_ONE",
    private: "PRIVATE",
    public: "PUBLIC"
}
chatTypeEnum = [chatType.oneToOne, chatType.private, chatType.public];

let shared = {
    publicChatName: "Public Group",
    publicChatCode: "123456",
    chatCodeR1: 100000,
    chatCodeR2: 900000,
    passwordRegex: new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'),
    chatType: chatType,
    chatTypeEnum: chatTypeEnum
};

module.exports = {
    shared
}