const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { findUserByEmail, findUserByProviderId, createUser, linkProvider } = require('../models/user.model');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const providerId = profile.id;
      const avatarUrl = profile.photos[0]?.value;

      // 1. Check if user exists with this Google ID
      let user = await findUserByProviderId('google', providerId);
      if (user) return done(null, user);

      // 2. Check if user exists with this email
      user = await findUserByEmail(email);
      if (user) {
        // Link Google ID to existing email account
        user = await linkProvider(user.id, 'google', providerId, avatarUrl);
        return done(null, user);
      }

      // 3. Create new user
      user = await createUser(email, null, providerId, null, avatarUrl);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
      const providerId = profile.id;
      const avatarUrl = profile.photos?.[0]?.value;

      // 1. Check if user exists with this GitHub ID
      let user = await findUserByProviderId('github', providerId);
      if (user) return done(null, user);

      // 2. Check if user exists with this email
      user = await findUserByEmail(email);
      if (user) {
        // Link GitHub ID to existing email account
        user = await linkProvider(user.id, 'github', providerId, avatarUrl);
        return done(null, user);
      }

      // 3. Create new user
      user = await createUser(email, null, null, providerId, avatarUrl);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

module.exports = passport;
