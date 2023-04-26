const router = require("express").Router();

router.use("/user", require("./userRoutes"));
router.use("/auth", require("./authRoutes"));
router.use("/chat", require("./chatRoutes"));


module.exports = router;