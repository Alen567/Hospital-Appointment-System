
require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
    try {
        console.log("\n=== CareConnect First Admin Setup ===\n");

        const name = (await ask("Admin name: ")).trim();
        const email = (await ask("Admin email: ")).trim().toLowerCase();
        const password = await ask("Admin password: ");

        if (!name || !email || !password) {
            throw new Error("All fields are required.");
        }

        if (name.length > 100 || email.length > 150) {
            throw new Error("Name or email is too long.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Please enter a valid email address.");
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters.");
        }

        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existing.rows.length > 0) {
            throw new Error("An account with this email already exists.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users
                (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'admin')
             RETURNING id, name, email, role`,
            [name, email, passwordHash]
        );

        console.log("\nAdmin account created successfully!");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("\nAdmin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await pool.end();
    }
}

createAdmin();
