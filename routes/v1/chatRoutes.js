const router = require("express").Router();
const userMiddleware = require("../../middlewares/userMiddleware");
const chatController = require("../../controllers/chatController");

//chat routes
router.post("/create-private-chat-group", userMiddleware.verifyAuth, chatController.createPrivateGroup);
router.post("/join-private-chat-group", userMiddleware.verifyAuth, chatController.joinPrivateChatGroup);

module.exports = router;