// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running 🚀",
  });
});

// Example API route
app.post("/api/test", (req, res) => {
  const data = req.body;

  res.json({
    success: true,
    received: data,
  });
});

// Stripe Checkout Example (optional)
app.post("/checkout", async (req, res) => {
  try {
    const { email, plan } = req.body;

    // Replace with your actual logic
    console.log("Checkout request:", { email, plan });

    res.json({
      success: true,
      url: "https://example.com/checkout-success",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// Port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});