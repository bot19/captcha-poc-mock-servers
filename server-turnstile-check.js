import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Only serve static files if public directory exists
const publicDir = path.join(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

app.post("/turnstile-check", async (req, res) => {
  try {
    const { token } = req.body;

    const formData = new URLSearchParams();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await verifyResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error verifying turnstile token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5183;

app.listen(PORT, () => {
  console.log(`✅ Turnstile PoC server running on http://localhost:${PORT}`);
}).on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
