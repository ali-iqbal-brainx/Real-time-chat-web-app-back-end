const router = require("express").Router();
const userMiddleware = require("../../middlewares/userMiddleware");
const userController = require("../../controllers/userController");

//user routes
router.post("/profile-setup", userMiddleware.verifyAuth, userController.profileSetup);
router.get("/get-user-data", userMiddleware.verifyAuth, userController.getUserData);

module.exports = router;