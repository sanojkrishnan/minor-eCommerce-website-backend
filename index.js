const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const Item = require("./models")
const cors = require("cors");

const App = express();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

App.use(cors())

// Server endpoint
App.get("/", async (req, res) => {
  try {
    const items = await Item.find(); // Fetch all items from the database
    res.json(items); // Send the items as a JSON response
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
App.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
