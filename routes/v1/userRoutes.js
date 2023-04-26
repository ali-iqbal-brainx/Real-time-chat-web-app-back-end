const router = require("express").Router();
const userMiddleware = require("../../middlewares/userMiddleware");
const userController = require("../../controllers/userController");

//user routes
router.put("/profile-setup", userMiddleware.verifyAuth, userController.profileSetup);
router.get("/get-user-data", userMiddleware.verifyAuth, userController.getUserData);//when id is not present return user obj
router.get("/get-user-data/:id", userMiddleware.verifyAuth, userController.getUserData);//when id is present then return the id object user
router.get("/get-all-users", userMiddleware.verifyAuth, userController.getUsers);

module.exports = router;