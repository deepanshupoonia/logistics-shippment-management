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
        
        console.log('Updating passwords for all dummy users...');

        await pool.query(`
            UPDATE users SET password = $1 
            WHERE email IN (
                'admin@greenleaf.com', 
                'steve@greenleaf.com', 
                'wendy@greenleaf.com', 
                'support@greenleaf.com', 
                'ops@greenleaf.com'
            )
        `, [hashedPassword]);

        console.log('✅ Passwords updated successfully!');
        console.log('Log in with -> Email: steve@greenleaf.com | Password: password123');
    } catch (err) {
        console.error('❌ Error updating passwords:', err);
    } finally {
        pool.end();
    }
}

seed();