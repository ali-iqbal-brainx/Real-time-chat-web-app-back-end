const router = require("express").Router();
const authController = require("../../controllers/authController");

//profile setup
router.post("/log-in", authController.login);
router.post("/sign-up", authController.signup);

module.exports = router;