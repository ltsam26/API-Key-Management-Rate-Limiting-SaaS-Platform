const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const { chat, getContext } = require("../controllers/ai.controller");

router.post("/chat",    auth, chat);
router.get("/context",  auth, getContext);   // debug endpoint

module.exports = router;
