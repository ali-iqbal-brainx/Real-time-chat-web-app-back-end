const router = require("express").Router();
const userMiddleware = require("../../middlewares/userMiddleware");
const chatController = require("../../controllers/chatController");

//chat routes
router.post("/create-private-chat-group", userMiddleware.verifyAuth, chatController.createPrivateGroup);
router.post("/join-private-chat-group/:id", userMiddleware.verifyAuth, chatController.joinPrivateChatGroup);
router.get("/get-public-chat-data/:chk", userMiddleware.verifyAuth, chatController.getPublicChatData);
router.post("/append-message", userMiddleware.verifyAuth, chatController.postMessage);
router.get("/get-all-chats", userMiddleware.verifyAuth, chatController.listAllChats);

//private group
router.get("/get-private-chat-data/:id/:chk", userMiddleware.verifyAuth, chatController.getPrivateChatData);
router.post("/append-message-private-group/:id", userMiddleware.verifyAuth, chatController.postPrivateGroupMsg);
router.put("/leave-private-group/:id", userMiddleware.verifyAuth, chatController.leaveGroup);
router.delete("/delete-group/:id", userMiddleware.verifyAuth, chatController.deleteGroup);

//one to one group
router.get("/get-one-to-one-chat-data/:id/:chk", userMiddleware.verifyAuth, chatController.getOneToOneChatData);
router.post("/append-message-one-to-one/:id", userMiddleware.verifyAuth, chatController.postOneToOneGroupMsg);

//see message
router.post("/see-message/:id1/:id2/:type", userMiddleware.verifyAuth, chatController.seeMessage);

module.exports = router;