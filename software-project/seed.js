const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seed() {
    try {
        // Hash the password "password123"
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Clear existing admin to prevent duplicate email errors
        await pool.query("DELETE FROM users WHERE email = 'admin@greenleaf.com'");

        // Insert fresh user
        await pool.query(`
            INSERT INTO users (name, email, password, role) 
            VALUES ('Admin User', 'admin@greenleaf.com', $1, 'operations')
        `, [hashedPassword]);

        console.log('Admin user successfully seeded!');
        console.log('Log in with -> Email: admin@greenleaf.com | Password: password123');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        pool.end();
    }
}

seed();