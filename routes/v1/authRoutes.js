const router = require("express").Router();
const authController = require("../../controllers/authController");
const userMiddleware = require("../../middlewares/userMiddleware");

//profile setup
router.post("/log-in", authController.login);
router.post("/sign-up", userMiddleware.signUpAuth, authController.signup);
router.put("/sign-out", userMiddleware.verifyAuth, authController.signout);

module.exports = router;