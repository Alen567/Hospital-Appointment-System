require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

process.on("beforeExit", (code) => {
    console.log("Node beforeExit:", code);
});

process.on("exit", (code) => {
    console.log("Node exit:", code);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

const PORT = process.env.PORT || 5000;


const startServer = async () => {
    try {
        await pool.query("SELECT 1");

        console.log("PostgreSQL connected successfully");

        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`CareConnect server running on port ${PORT}`);
            console.log("Server listening:", server.listening);
            console.log("Server address:", server.address());
        });

        server.on("close", () => {
            console.log("HTTP server closed unexpectedly");
        });

        server.on("error", (error) => {
            console.error("HTTP server error:", error);
        });

    } catch (error) {
        console.error("Unable to connect to PostgreSQL:", error.message);
        process.exit(1);
    }
};

startServer();