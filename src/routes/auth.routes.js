const express = require("express");
const passport = require("passport");
const router = express.Router();
const { signup, login, oauthSuccess } = require("../controllers/auth.controller");
require("../config/passport"); // Critical: Load strategy configs

router.post("/signup", signup);
router.post("/login", login);

// --- Google OAuth ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  oauthSuccess
);

// --- GitHub OAuth ---
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
router.get("/github/callback", 
  passport.authenticate("github", { failureRedirect: "/login", session: false }),
  oauthSuccess
);

module.exports = router;