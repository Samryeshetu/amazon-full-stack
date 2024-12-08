const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const app = express();

// Configure CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// Test Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Success!",
  });
});

// Create Payment Intent Endpoint

app.post("/payment/create", async (req, res) => {
  try {
    const { total } = req.body;

    if (!total) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    console.log("Creating payment intent for total:", total);

    // Create Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
    });

    const clientSecret = paymentIntent.client_secret;

    console.log("Payment Intent Created:", clientSecret);

    res.status(200).json({ clientSecret });
  } catch (err) {
    console.error("Stripe Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const port = 4000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

exports.api = onRequest(app);
