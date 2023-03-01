const constants = require("../shared/constants");
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const createPrivateGroup = async (request, response) => {
    try {
        const user = request.user;
        const { name } = request.body;

        console.log("user :", user);
        console.log("name :", name);

        if (!name) {
            return response
                .status(406)
                .json({
                    error: "Required fields are missing"
                });
        }

        const chatCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("chat code :", chatCode);
        const hashedChatCode = await bcrypt.hash(chatCode, 10);

        const _id = uuid.v4();
        const ids = [user._id];
        //insert chat obj in private_group_chats array
        constants.private_group_chats.push({ _id: _id, ids: ids, name: name, chatCode: hashedChatCode });
        console.log("chats :", constants.private_group_chats);

        return response
            .status(200)
            .json({
                group_chat: {
                    _id,
                    ids,
                    name,
                    chatCode
                }
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const joinPrivateChatGroup = async (request, response) => {
    try {
        const user = request.user;
        const { code } = request.body;

        console.log("user :", user);
        console.log("code :", code);

        if (!code) {
            return response
                .status(406)
                .json({
                    error: "Required field is missing"
                });
        }

        let chat = null;
        for (let i = 0; i < constants.private_group_chats.length; i++) {
            if (bcrypt.compare(code, constants.private_group_chats[i].chatCode)) {
                //if user already in chat room then do not push
                constants.private_group_chats[i].ids.indexOf(user._id) === -1 ?
                    constants.private_group_chats[i].ids.push(user._id) :
                    console.log("User already joined the chat room");

                chat = constants.private_group_chats[i];
                break;
            }
            if (++i === constants.private_group_chats.length) {
                return response
                    .status(400)
                    .json({
                        error: "invalid chat code"
                    })
            }

        }

        console.log("chat :", chat);

        return response
            .status(200)
            .json({
                chat
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

module.exports = {
    createPrivateGroup,
    joinPrivateChatGroup
}