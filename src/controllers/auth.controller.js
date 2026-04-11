const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserByProviderId, linkProvider } = require("../models/user.model");

// SIGNUP
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await createUser(email, passwordHash);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
      token: token,
    });
  } catch (error) {
    console.error("[Auth] Signup Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN WITH JWT
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      },
    });
  } catch (error) {
    console.error("[Auth] Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// OAUTH SUCCESS CALLBACK
const oauthSuccess = (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/success?token=${token}`);
  } catch (error) {
    console.error("OAuth Success error:", error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
  }
};

module.exports = {
  signup,
  login,
  oauthSuccess
};