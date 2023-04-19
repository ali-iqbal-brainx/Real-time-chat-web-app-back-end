const constants = require("../shared/constants");
const chatService = require("../services/chatService");
const bcrypt = require("bcryptjs");
const { default: mongoose } = require("mongoose");


const createPrivateGroup = async (request, response) => {
    try {
        const user = request.user;
        const { name } = request.body;

        console.log("name :", name);

        if (!name) {
            return response
                .status(406)
                .json({
                    error: "Required field is missing"
                });
        }

        const chatCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("chat code :", chatCode);

        const privateGroup = await chatService.createPrivateChat(
            {
                "adminId": user._id,
                "ids": [user._id],
                "name": name,
                "chatCode": chatCode,
                "messages": []
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
                .status(406)
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
                .status(406)
                .json({
                    error: "Required field is missing"
                });
        }

        console.log("in get public chat data controller");

        let publicGroup;
        // see all msg by the curr user
        if (chk) {

            publicGroup = await chatService.updatePublicChat(
                {
                    chatCode: constants.shared.publicChatCode
                },
                {
                    $addToSet: { "messages.$[].seenBy": user._id }
                },
                {
                    new: true
                }
            );

        }
        console.log("public chat :", publicGroup);

        const publicChatAggr = await chatService.publicChatAggregate([
            {
                $match: {
                    chatCode: constants.shared.publicChatCode
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
                .status(406)
                .json({
                    error: "Required field is missing"
                });
        }

        let chat = { _id: new mongoose.Types.ObjectId(), seenBy: [user._id], userId: user._id, message: message };
        const publicGroup = await chatService.updatePublicChat(
            {
                name: constants.shared.publicChatName
            },
            {
                $push: {
                    messages: chat
                }
            },
            {
                new: true
            }
        );
        console.log("public chat after appending message :", publicGroup);

        delete chat.userId;
        chat['userDetails'] = { _id: user._id, name: user.name };

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

const postPrivateGroupMsg = async (request, response) => {
    try {
        const user = request.user;
        const groupId = request.params.id;
        const { message } = request.body;

        if (!message || !groupId) {
            return response
                .status(406)
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

            let chat = { _id: new mongoose.Types.ObjectId(), userId: user._id, seenBy: [user._id], message: message };
            const updatedChat = await chatService.updatePrivateChat(
                {
                    _id: groupId
                },
                {
                    $push: { messages: chat }
                },
                {
                    new: true
                }
            );
            console.log("updted chat msgs :", updatedChat.messages);

            delete chat.userId;
            chat['userDetails'] = { _id: user._id, name: user.name };

            return response
                .status(200)
                .json({
                    chat
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
                .status(406)
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

                privateGroup = await chatService.updatePrivateChat(
                    {
                        $or: [
                            { _id: id },
                            { chatCode: id }
                        ]
                    },
                    {
                        $addToSet: { "messages.$[].seenBy": user._id }
                    },
                    {
                        new: true
                    }
                );
                console.log("private chat :", privateGroup);

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
        //     {
        //         $addFields: {
        //             userId: user._id
        //         }
        //     },
        //     {
        //         $match: {
        //             $expr: {
        //                 $setIsSubset: [
        //                     [user._id],
        //                     "$ids"
        //                 ]
        //             }
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 1,
        //             name: 1,
        //             chatCode: 1,
        //             adminId: 1,
        //             messages: 1,
        //             userId: 1,
        //             unseenCount: {
        //                 $size: {
        //                     $filter: {
        //                         input: "$messages",
        //                         as: "message",
        //                         cond: {
        //                             $not: {
        //                                 $in: ["$userId", "$$message.seenBy"]
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$messages"
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "users",
        //             let: { usrId: "$messages.userId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $eq: ["$_id", "$$usrId"]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         name: 1,
        //                     }
        //                 }
        //             ],
        //             as: "details"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: '$details',
        //             preserveNullAndEmptyArrays: true
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: "$_id",
        //             unseenCount: {
        //                 $first: "$unseenCount"
        //             },
        //             name: {
        //                 $first: "$name"
        //             },
        //             chatCode: {
        //                 $first: "$chatCode"
        //             },
        //             adminId: {
        //                 $first: "$adminId"
        //             },
        //             messages: {
        //                 $push: {
        //                     _id: "$messages._id",
        //                     seenBy: "$messages.seenBy",
        //                     message: "$messages.message",
        //                     userDetails: "$details"
        //                 }
        //             }
        //         }
        //     }
        // ]);

        const privateChatAggr = await chatService.privateChatAggregate([
            {
                $match: {
                    ids: { $in: [user._id] } // Match documents that contain the user's ID in the ids array
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
        //     {
        //         $match: {
        //             $expr: {
        //                 $setIsSubset: [
        //                     [user._id],
        //                     "$ids"
        //                 ]
        //             }
        //         }
        //     },
        //     {
        //         $addFields: {
        //             userId: user._id
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 1,
        //             messages: 1,
        //             userId: 1,
        //             ids: 1,
        //             unseenCount: {
        //                 $size: {
        //                     $filter: {
        //                         input: "$messages",
        //                         as: "message",
        //                         cond: {
        //                             $not: {
        //                                 $in: ["$userId", "$$message.seenBy"]
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     { "$unwind": "$ids" },
        //     {

        //         "$lookup": {
        //             from: "users",
        //             let: { usrs: "$ids" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr:
        //                         {
        //                             $eq: ["$_id", "$$usrs"]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         _id: 0,
        //                         name: 1,
        //                     }
        //                 }
        //             ],
        //             as: "names"
        //         }
        //     },
        //     { "$unwind": "$names" },
        //     {
        //         "$group": {
        //             "_id": "$_id",
        //             "ids": { "$push": "$ids" },
        //             "names": { "$push": "$names" },
        //             "messages": {
        //                 $first: "$messages"
        //             },
        //             "unseenCount": {
        //                 $first: "$unseenCount"
        //             },
        //             "userId": {
        //                 $first: "$userId"
        //             },
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$messages"
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "users",
        //             let: { usrId: "$messages.userId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $eq: ["$_id", "$$usrId"]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         name: 1,
        //                     }
        //                 }
        //             ],
        //             as: "details"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: '$details',
        //             preserveNullAndEmptyArrays: true
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: "$_id",
        //             ids: {
        //                 $first: "$ids"
        //             },
        //             names: {
        //                 $first: "$names"
        //             },
        //             unseenCount: {
        //                 $first: "$unseenCount"
        //             },
        //             messages: {
        //                 $push: {
        //                     _id: "$messages._id",
        //                     seenBy: "$messages.seenBy",
        //                     message: "$messages.message",
        //                     userDetails: "$details"
        //                 }
        //             }
        //         }
        //     }
        // ]);

        const oneToOneChatAggr = await chatService.oneToOneChatAggregate([
            {
                $match: {
                    ids: { $in: [user._id] } // Match documents that contain the user's ID in the ids array
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
                .status(406)
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

                oneToOneChat = await chatService.updateOneToOneChat(
                    {
                        $or: [
                            { _id: id },
                            { chatCode: id }
                        ]
                    },
                    {
                        $addToSet: { "messages.$[].seenBy": user._id }
                    },
                    {
                        new: true
                    }
                );

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
                .status(406)
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

            let chat = { _id: new mongoose.Types.ObjectId(), userId: user._id, seenBy: [user._id], message: message };

            const updatedChat = await chatService.updateOneToOneChat(
                {
                    _id: oneToOneChat._id
                },
                {
                    $push: { messages: chat }
                },
                {
                    new: true
                }
            );
            console.log("updted chat msgs :", updatedChat.messages);

            delete chat.userId;
            chat['userDetails'] = { _id: user._id, name: user.name };

            return response
                .status(200)
                .json({
                    chat
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
                .status(406)
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
        const user = request.user
        const chatId = request.params.id;

        console.log("group to delete id :", chatId);

        if (!chatId) {
            return response
                .status(406)
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
        const chatId = request.params.id1;
        const msgId = request.params.id2;
        const chatType = request.params.type;

        console.log("chat id :", chatId);
        console.log("msg id :", msgId);
        console.log("chat type :", chatType);

        if (!chatId || !msgId || !chatType) {
            return response
                .status(406)
                .json({
                    error: "Required fields is missing"
                });
        }


        switch (chatType) {
            case "PUBLIC": {
                console.log("public chat type");
                await chatService.updatePublicChat(
                    { "_id": chatId, "messages._id": msgId },
                    {
                        "$push": { "messages.$.seenBy": user._id }
                    }
                );
                break;
            }

            case "PRIVATE": {
                console.log("private chat type");
                const privateChat = await chatService.findPrivateGroup(
                    {
                        _id: chatId
                    }
                );

                if (!privateChat) {
                    return response
                        .status(400)
                        .json({
                            error: "group with this id does not exist"
                        })
                }
                //push user id in seen by array
                await chatService.updatePrivateChat(
                    { "_id": chatId, "messages._id": msgId },
                    {
                        "$push": { "messages.$.seenBy": user._id }
                    }
                );
                break;
            }

            case "ONE_TO_ONE": {
                console.log("one to one chat type");

                const oneToOneChat = await chatService.findOneToOneChat(
                    {
                        _id: chatId
                    }
                );

                if (!oneToOneChat) {
                    return response
                        .status(400)
                        .json({
                            error: "group with this id does not exist"
                        })
                }
                //push user id in seen by array
                const updatedDoc = await chatService.updateOneToOneChat(
                    { "_id": chatId, "messages._id": msgId },
                    {
                        "$push": { "messages.$.seenBy": user._id }
                    },
                    { new: true }
                );
                console.log(">>>>>>>>>>>>>>>>>Updated doc<<<<<<<<<<<<<", updatedDoc);
                break;
            }

            default: {
                return response
                    .status(400)
                    .json({
                        error: "Invalid chat type"
                    });
            }

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