const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const { Item, Cart } = require("./models");
const cors = require("cors");

const App = express();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

App.use(cors());
// Parse JSON bodies for POST/PUT requests
App.use(express.json());

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

App.get("/cart", async (req, res) => {
  try {
    const carts = await Cart.find();
    res.json(carts);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

App.post("/add-to-cart", async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    // Normalize and validate quantity
    let qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) qty = 1;

    // 1️⃣ Validation
    if (!itemId) {
      return res.status(400).json({ message: "itemId is required" });
    }

    // 2️⃣ Check item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // 3️⃣ Check if item already in cart
    const cartItem = await Cart.findOne({ itemId });

    if (cartItem) {
      cartItem.quantity += qty;
      await cartItem.save();

      return res.json({
        message: "Cart updated",
        cart: cartItem,
      });
    }

    // 4️⃣ Create new cart item
    const newCartItem = new Cart({
      itemId,
      quantity: qty,
    });

    await newCartItem.save();

    res.status(201).json({
      message: "Item added to cart",
      cart: newCartItem,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

App.get("/cart-item/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    } else {
      res.json(item);
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

App.patch("/cart-item/:id/increment", async (req, res) => {
  try {
    const cartItem = await Cart.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: 1 } },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

App.patch("/cart-item/:id/decrement", async (req, res) => {
  try {
    const cartItem = await Cart.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: -1 } },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (cartItem.quantity <= 0) {
      await Cart.findByIdAndDelete(req.params.id);
      return res.json({ message: "Item removed from cart" });
    }

    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /cart/:id → Delete a cart item by its _id
App.delete("/cart/:id", async (req, res) => {
  try {
    const cartItem = await Cart.findByIdAndDelete(req.params.id);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Cart item deleted successfully", cart: cartItem });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
App.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
