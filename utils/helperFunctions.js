const constants = require("../shared/constants");

const generateChatCode = () => {

    return Math.floor(constants.shared.chatCodeR1 + Math.random() * constants.shared.chatCodeR2).toString();

}

module.exports = {
    generateChatCode
}