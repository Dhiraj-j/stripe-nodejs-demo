const express = require("express");
require("dotenv").config();
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(`${process.env.STRIPE_SECRET_KEY}`);
const app = express();
const PORT = 8080;

app.use("/stripe", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(cors());

app.post("/pay", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "please enter a name" });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(25 * 100),
      currency: "INR",
      payment_method_types: ["card"],
      metadata: { name },
    });
    const clientSecret = paymentIntent.client_secret;
    res.json({
      message: "payment initiated",
      clientSecret,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
});

app.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = await stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOKS_KEY
    );
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
  if (event.type === "payment_intent.succeeded") {
    console.log("payment completed");
  }
  console.log(event);
});
app.listen(PORT, () => console.log("running at port", PORT));
