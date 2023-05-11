const constants = require("../shared/constants");
const chatService = require("../services/chatService");
const messageService = require("../services/messageService");
const utils = require("../utils/helperFunctions");
const { default: mongoose } = require("mongoose");


const createPrivateGroup = async (request, response) => {
    try {
        const user = request.user;
        const { name } = request.body;

        console.log("name :", name);

        if (!name) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        const chatCode = utils.generateChatCode();
        console.log("chat code :", chatCode);

        const chat = await chatService.findPrivateGroup(
            {
                chatCode
            }
        );

        if (chat?._id) {
            return response
                .status(422)
                .json({
                    error: "try creating group with another code"
                });
        }


        const privateGroup = await chatService.createPrivateChat(
            {
                "adminId": user._id,
                "ids": [user._id],
                "name": name,
                "chatCode": chatCode
            }
        );
        console.log("private group chat :", privateGroup);

        return response
            .status(200)
            .json({
                private_group_chat: {
                    _id: privateGroup._id,
                    adminId: privateGroup.userId,
                    ids: privateGroup.ids,
                    name: privateGroup.name,
                    chatCode: privateGroup.chatCode
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
        const code = request.params.id;

        console.log("chat code :", code);

        if (!code) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        let privateGroup = await chatService.findPrivateGroup(
            {
                chatCode: code
            }
        );

        if (!privateGroup) {
            return response
                .status(400)
                .json({
                    error: "invalid chat code"
                })
        } else {
            //if user already in chat room then do not push
            if (!privateGroup.ids?.includes(user._id)) {
                privateGroup = await chatService.updatePrivateChat(
                    {
                        chatCode: code
                    },
                    {
                        $push: { ids: user._id }
                    },
                    {
                        new: true
                    }
                )
            }
        }

        console.log("private group :", privateGroup);

        return response
            .status(200)
            .json({
                chat: privateGroup
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const getPublicChatData = async (request, response) => {
    try {
        const user = request.user;
        let chk = request.params.chk;

        if (!chk) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        console.log("in get public chat data controller");

        // see all msg by the curr user
        if (chk) {

            console.log("updated doc count :",
                await messageService.updateMessages(
                    {
                        chatType: constants.shared.chatType.public
                    },
                    {
                        $addToSet: { seenBy: user._id }
                    }
                )
            );
        }

        const publicChatAggr = await chatService.publicChatAggregate([
            {
                $match: {
                    chatCode: constants.shared.publicChatCode
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "chatId",
                    as: "messages"
                }
            },
            {
                $unwind: {
                    path: "$messages",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { usrId: "$messages.userId" },
                    pipeline: [
                        {
                            $match: {
                                $expr:
                                {
                                    $eq: ["$_id", "$$usrId"]
                                }
                            }
                        },
                        {
                            $project: {
                                name: 1,
                            }
                        }
                    ],
                    as: "details"
                }
            },
            {
                $unwind: {
                    path: '$details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    name: {
                        $first: "$name"
                    },
                    chatCode: {
                        $first: "$chatCode"
                    },
                    messages: {
                        $push: {
                            _id: "$messages._id",
                            seenBy: "$messages.seenBy",
                            message: "$messages.message",
                            updatedAt: "$messages.updatedAt",
                            createdAt: "$messages.createdAt",
                            userDetails: "$details"
                        }
                    }
                }
            }
        ]);

        return response
            .status(200)
            .json({
                publicChat: publicChatAggr
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const postMessage = async (request, response) => {
    try {
        const user = request.user;
        const { message } = request.body;

        if (!message) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        const publicGroup = await chatService.findPublicChat(
            {
                chatCode: constants.shared.publicChatCode
            }
        );

        if (!publicGroup) {
            return response
                .status(404)
                .json({
                    error: "Chat does not exist!"
                });
        }

        const msg = await utils.postMessage(publicGroup, constants.shared.chatType.public, user, message);

        return response
            .status(200)
            .json({
                msg
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const postPrivateGroupMsg = async (request, response) => {
    try {
        const user = request.user;
        const groupId = request.params.id;
        const { message } = request.body;

        if (!message || !groupId) {
            return response
                .status(422)
                .json({
                    error: "Required fields are missing"
                });
        }

        const privateGroup = await chatService.findPrivateGroup(
            {
                _id: groupId
            }
        );

        if (!privateGroup) {

            return response
                .status(400)
                .json({
                    error: "private group with id does not exist"
                });

        } else if (privateGroup.ids.includes(user._id)) {

            const msg = await utils.postMessage(privateGroup, constants.shared.chatType.private, user, message);

            return response
                .status(200)
                .json({
                    msg
                });

        } else {

            return response
                .status(400)
                .json({
                    error: "you are not a member of this group"
                });

        }


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const getPrivateChatData = async (request, response) => {
    try {
        const user = request.user;
        const id = request.params.id;
        let check = request.params.chk;

        if (!id || !check) {
            return response
                .status(422)
                .json({
                    error: "Required params are missing"
                });
        }

        let privateGroup = await chatService.findPrivateGroup(
            {
                $or: [
                    { _id: id },
                    { chatCode: id }
                ]
            }
        );

        if (!privateGroup) {

            return response
                .status(400)
                .json({
                    error: "private group with id does not exist"
                });

        } else if (privateGroup.ids.includes(user._id)) {

            // see all msg by the curr user
            if (check) {

                console.log("updated doc count :", await utils.seenAllMessages(id, user));

            }

            const privateChatAggr = await chatService.privateChatAggregate([
                {
                    $match: {
                        $or: [
                            { _id: new mongoose.Types.ObjectId(id) },
                            { chatCode: id }
                        ]

                    }
                },
                {
                    $lookup: {
                        from: "messages",
                        localField: "_id",
                        foreignField: "chatId",
                        as: "messages"
                    }
                },
                {
                    $unwind: {
                        path: "$messages",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        let: { usrId: "$messages.userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ["$_id", "$$usrId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                }
                            }
                        ],
                        as: "details"
                    }
                },
                {
                    $unwind: {
                        path: '$details',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        name: {
                            $first: "$name"
                        },
                        ids: {
                            $first: "$ids"
                        },
                        chatCode: {
                            $first: "$chatCode"
                        },
                        adminId: {
                            $first: "$adminId"
                        },
                        messages: {
                            $push: {
                                _id: "$messages._id",
                                seenBy: "$messages.seenBy",
                                message: "$messages.message",
                                createdAt: "$messages.createdAt",
                                updatedAt: "$messages.updatedAt",
                                userDetails: "$details"
                            }
                        }
                    }
                }
            ]);
            console.log("private agr :", privateChatAggr);

            if (privateChatAggr.length) {
                return response
                    .status(200)
                    .json({
                        privateChat: privateChatAggr[0]
                    });
            } else {
                return response
                    .status(400)
                    .json({
                        error: "group deos not exist"
                    });
            }

        } else {

            return response
                .status(400)
                .json({
                    error: "you are not a member of this group"
                });

        }

    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const listAllChats = async (request, response) => {
    try {
        const user = request.user;
        console.log("in list all chats");

        const publicChatAggr = await chatService.publicChatAggregate([
            {
                $match: {
                    chatCode: constants.shared.publicChatCode
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "chatId",
                    as: "messages"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "messages.userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    messages: {
                        $map: {
                            input: "$messages",
                            as: "msg",
                            in: {
                                _id: "$$msg._id",
                                message: "$$msg.message",
                                seenBy: "$$msg.seenBy",
                                userDetails: {
                                    $arrayElemAt: [
                                        { $filter: { input: "$userDetails", cond: { $eq: ["$$this._id", "$$msg.userId"] } } },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    unseenCount: {
                        $size: {
                            $filter: {
                                input: "$messages",
                                cond: { $not: [{ $in: [user._id, "$$this.seenBy"] }] } // Check if the user's ID is not in the seenBy array
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    userDetails: 0
                }
            },
            {
                $sort: { unseenCount: 1 }
            }
        ]);

        const privateChatAggr = await chatService.privateChatAggregate([
            {
                $match: {
                    ids: { $in: [user._id] } // Match documents that contain the user's ID in the ids array
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "chatId",
                    as: "messages"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "messages.userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    messages: {
                        $map: {
                            input: "$messages",
                            as: "msg",
                            in: {
                                _id: "$$msg._id",
                                message: "$$msg.message",
                                seenBy: "$$msg.seenBy",
                                userDetails: {
                                    $arrayElemAt: [
                                        { $filter: { input: "$userDetails", cond: { $eq: ["$$this._id", "$$msg.userId"] } } },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    unseenCount: {
                        $size: {
                            $filter: {
                                input: "$messages",
                                cond: { $not: [{ $in: [user._id, "$$this.seenBy"] }] } // Check if the user's ID is not in the seenBy array
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    userDetails: 0
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        const oneToOneChatAggr = await chatService.oneToOneChatAggregate([
            {
                $match: {
                    ids: { $in: [user._id] } // Match documents that contain the user's ID in the ids array
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "chatId",
                    as: "messages"
                }
            },
            { "$unwind": "$ids" },
            {

                "$lookup": {
                    from: "users",
                    let: { usrs: "$ids" },
                    pipeline: [
                        {
                            $match: {
                                $expr:
                                {
                                    $eq: ["$_id", "$$usrs"]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                            }
                        }
                    ],
                    as: "names"
                }
            },
            { "$unwind": "$names" },
            {
                "$group": {
                    "_id": "$_id",
                    "ids": { "$push": "$ids" },
                    "names": { "$push": "$names" },
                    "messages": {
                        $first: "$messages"
                    },
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "messages.userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    messages: {
                        $map: {
                            input: "$messages",
                            as: "msg",
                            in: {
                                _id: "$$msg._id",
                                message: "$$msg.message",
                                seenBy: "$$msg.seenBy",
                                userDetails: {
                                    $arrayElemAt: [
                                        { $filter: { input: "$userDetails", cond: { $eq: ["$$this._id", "$$msg.userId"] } } },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            // Project to shape the output
            {
                $project: {
                    _id: 1,
                    ids: 1,
                    names: 1,
                    messages: 1,
                }
            },
            {
                $addFields: {
                    unseenCount: {
                        $size: {
                            $filter: {
                                input: "$messages",
                                cond: { $not: [{ $in: [user._id, "$$this.seenBy"] }] } // Check if the user's ID is not in the seenBy array
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        return response
            .status(200)
            .json({
                privateChats: privateChatAggr,
                oneToOneChats: oneToOneChatAggr,
                publicChat: publicChatAggr
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const getOneToOneChatData = async (request, response) => {
    try {
        const user = request.user;
        const id = request.params.id;
        let check = request.params.chk;

        if (!id || !check) {
            return response
                .status(422)
                .json({
                    error: "Required params are missing"
                });
        }

        let oneToOneChat = await chatService.findOneToOneChat(
            {
                $or: [
                    { _id: id },
                    { chatCode: id }
                ]
            }
        );


        if (!oneToOneChat) {

            return response
                .status(400)
                .json({
                    error: "chat with id does not exist"
                });

        } else if (oneToOneChat.ids.includes(user._id)) {

            if (check) {

                console.log("updated doc count :", await utils.seenAllMessages(id, user));

            }

            const oneToOneAggr = await chatService.oneToOneChatAggregate([
                {
                    $match: {
                        $or: [
                            { _id: new mongoose.Types.ObjectId(id) },
                            { chatCode: id }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "messages",
                        localField: "_id",
                        foreignField: "chatId",
                        as: "messages"
                    }
                },
                { "$unwind": "$ids" },
                {

                    "$lookup": {
                        from: "users",
                        let: { usrs: "$ids" },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ["$_id", "$$usrs"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    name: 1,
                                }
                            }
                        ],
                        as: "names"
                    }
                },
                { "$unwind": "$names" },
                {
                    "$group": {
                        "_id": "$_id",
                        "ids": { "$push": "$ids" },
                        "names": { "$push": "$names" },
                        "messages": {
                            $first: "$messages"
                        },
                    }
                },
                {
                    $unwind: {
                        path: "$messages",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        let: { usrId: "$messages.userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $eq: ["$_id", "$$usrId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                }
                            }
                        ],
                        as: "details"
                    }
                },
                {
                    $unwind: {
                        path: '$details',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        ids: {
                            $first: "$ids"
                        },
                        names: {
                            $first: "$names"
                        },
                        messages: {
                            $push: {
                                _id: "$messages._id",
                                seenBy: "$messages.seenBy",
                                message: "$messages.message",
                                createdAt: "$messages.createdAt",
                                updatedAt: "$messages.updatedAt",
                                userDetails: "$details"
                            }
                        }
                    }
                }
            ]);

            if (oneToOneAggr.length) {
                return response
                    .status(200)
                    .json({
                        oneToOneChat: oneToOneAggr[0]
                    });
            } else {
                return response
                    .status(400)
                    .json({
                        error: "chat deos not exist"
                    });
            }

        } else {

            return response
                .status(400)
                .json({
                    error: "you are not a member of this chat"
                });

        }

    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const postOneToOneGroupMsg = async (request, response) => {
    try {
        const user = request.user;
        const id = request.params.id;
        const { message } = request.body;

        if (!message || !id) {
            return response
                .status(422)
                .json({
                    error: "Required fields are missing"
                });
        }

        let oneToOneChat = await chatService.findOneToOneChat(
            {
                _id: id
            }
        );

        if (!oneToOneChat) {

            return response
                .status(400)
                .json({
                    error: "one to one group with id does not exist"
                });

        } else if (oneToOneChat.ids.includes(user._id)) {

            const msg = await utils.postMessage(oneToOneChat, constants.shared.chatType.oneToOne, user, message);

            return response
                .status(200)
                .json({
                    msg
                });

        } else {

            return response
                .status(400)
                .json({
                    error: "you are not a member of this group"
                });

        }


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const leaveGroup = async (request, response) => {
    try {
        const user = request.user;
        const chatId = request.params.id;

        console.log("group to leave id :", chatId);

        if (!chatId) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        const privateGroup = await chatService.findPrivateGroup(
            {
                _id: chatId
            }
        );

        if (!privateGroup) {
            return response
                .status(400)
                .json({
                    error: "invalid chat id"
                })
        } else {
            //remove user id from ids array in group
            await chatService.updatePrivateChat(
                {
                    _id: chatId
                },
                {
                    $pull: { ids: user._id }
                },
                {
                    new: true
                }
            );
            console.log("group left successfully!");

            return response
                .status(200)
                .json({
                    message: "group left successfully!"
                });
        }

    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const deleteGroup = async (request, response) => {
    try {
        const user = request.user;
        const chatId = request.params.id;

        console.log("group to delete id :", chatId);

        if (!chatId) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        const privateGroup = await chatService.updatePrivateChat(
            {
                _id: chatId
            }
        );

        if (!privateGroup) {
            return response
                .status(400)
                .json({
                    error: "invalid chat id"
                });
        } else {

            if (privateGroup.adminId.toString() !== user._id.toString()) {
                return response
                    .status(400)
                    .json({
                        error: "User do not have privilege to delete this group"
                    });
            }
            //remove group
            await chatService.deletePrivateChat(
                {
                    _id: chatId
                }
            );
            //remove all messages related to group
            await messageService.deleteMessages(
                {
                    chatId
                }
            );
            console.log("group deleted successfully!");

            return response
                .status(200)
                .json({
                    message: "group deleted successfully!"
                });
        }


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const seeMessage = async (request, response) => {
    try {
        const user = request.user;
        const msgId = request.params.id1;

        console.log("msg id :", msgId);

        if (!msgId) {
            return response
                .status(422)
                .json({
                    error: "Required field is missing"
                });
        }

        const msgUpdatedCount = await messageService.updateMessages(
            { "_id": msgId },
            {
                "$addToSet": { "seenBy": user._id }
            }
        );

        if (!msgUpdatedCount) {
            return response
                .status(400)
                .json({
                    error: "Either chat or msg id is invalid or outdated!"
                });
        }


        return response
            .status(200)
            .json({
                message: "message seen successfully!"
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
    joinPrivateChatGroup,
    getPublicChatData,
    postMessage,
    postPrivateGroupMsg,
    getPrivateChatData,
    listAllChats,
    getOneToOneChatData,
    postOneToOneGroupMsg,
    leaveGroup,
    deleteGroup,
    seeMessage
}