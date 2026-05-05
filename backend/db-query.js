require('dotenv').config();
const pool = require('./src/config/db');

async function run() {
  try {
    // ============================================
    // 📖 VIEW DATA (SELECT)
    // ============================================
    
    // View all users
    const users = await pool.query('SELECT id, email, role, created_at FROM users');
    console.log('\n👤 USERS:');
    console.table(users.rows);

    // View all projects
    const projects = await pool.query('SELECT id, name, plan, user_id FROM projects');
    console.log('\n📁 PROJECTS:');
    console.table(projects.rows);

    // View all subscriptions
    const subs = await pool.query('SELECT user_id, plan_type, created_at, expires_at FROM subscriptions ORDER BY created_at DESC');
    console.log('\n💳 SUBSCRIPTIONS:');
    console.table(subs.rows);

    // ============================================
    // ✏️ INSERT DATA — Uncomment what you need
    // ============================================

    // // Insert a new user (with password "123456" hashed)
    // const bcrypt = require('bcrypt');
    // const hash = await bcrypt.hash('123456', 10);
    // await pool.query(
    //   `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
    //   ['newuser@example.com', hash]
    // );
    // console.log('✅ User inserted!');

    // // Insert a subscription
    // await pool.query(
    //   `INSERT INTO subscriptions (user_id, plan_type, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    //   ['USER_ID_HERE', 'PRO']
    // );
    // console.log('✅ Subscription inserted!');

    // ============================================
    // 🔄 UPDATE DATA — Uncomment what you need
    // ============================================

    // // Update user role to admin
    // await pool.query(
    //   `UPDATE users SET role = 'admin' WHERE email = $1`,
    //   ['sonkarsamir4@gmail.com']
    // );
    // console.log('✅ User role updated to admin!');

    // // Update project plan
    // await pool.query(
    //   `UPDATE projects SET plan = 'PRO' WHERE user_id = $1`,
    //   ['USER_ID_HERE']
    // );
    // console.log('✅ Project plan updated!');

    // ============================================
    // 🗑️ DELETE DATA — Uncomment what you need
    // ============================================

    // // Delete a user by email
    // await pool.query(`DELETE FROM users WHERE email = $1`, ['test@example.com']);
    // console.log('✅ User deleted!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
