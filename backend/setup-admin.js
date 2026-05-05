require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./src/config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function createCustomAdmin() {
  console.log("\n--- Secure Admin Generator ---");
  
  try {
    const email = await askQuestion("Enter your Admin Email (e.g., you@domain.com): ");
    
    if (!email || !email.includes('@')) {
      console.log("Invalid email address.");
      process.exit(1);
    }

    const plainPassword = await askQuestion("Enter your Admin Password: ");
    
    if (!plainPassword || plainPassword.length < 6) {
      console.log("Password must be at least 6 characters.");
      process.exit(1);
    }

    console.log("\nEncrypting password securely...");
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    
    // Check if user already exists
    const checkUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    
    if (checkUser.rows.length > 0) {
      // Elevate existing user to admin
      await pool.query(
        "UPDATE users SET role = 'admin', password_hash = $2 WHERE email = $1", 
        [email, passwordHash]
      );
      console.log(`\nSuccess! Updated existing user '${email}' to Admin role with new password.`);
    } else {
      // Insert brand new admin
      await pool.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')", 
        [email, passwordHash]
      );
      console.log(`\nSuccess! Created brand new Admin account: '${email}'.`);
    }

  } catch (err) {
    console.error("Database Error:", err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createCustomAdmin();
