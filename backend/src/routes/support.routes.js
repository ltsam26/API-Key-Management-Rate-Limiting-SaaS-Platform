const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { submitSupportTicket } = require("../controllers/support.controller");

router.post("/submit", authMiddleware, submitSupportTicket);

module.exports = router;
