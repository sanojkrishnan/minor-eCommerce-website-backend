const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const { Item, Cart } = require("./models");
const cors = require("cors");
const upload = require("./imageHandler");
const path = require("path");

const App = express();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

App.use(cors());
// Parse JSON bodies for POST/PUT requests
App.use(express.json());

App.use("/itemImage", express.static(path.join(process.cwd(), "itemImage")));

App.get("/", async (req, res) => {
  try {
    let {
      search = "",
      lowerPrice = 0,
      higherPrice = 0,
      sortBy = "name",
    } = req.query;

    let category = req.query.category || req.query["category[]"];
    if (typeof category === "string") category = [category];

    lowerPrice = Number(lowerPrice);
    higherPrice = Number(higherPrice);

    const filter = {};

    //  Search
    if (search.trim()) {
      filter.$or = [
        { productName: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
      ];
    }

    //  Category
    if (category && !category.includes("all")) {
      filter.category = { $in: category };
    }

    //  Sorting
    let sort = {};
    if (sortBy === "ascending") sort.offerPrice = 1;
    else if (sortBy === "descending") sort.offerPrice = -1;
    else sort.productName = 1;

    const items = await Item.find(filter).sort(sort);

    //  Price filter
    if (lowerPrice > 0 || higherPrice > lowerPrice) {
      const priceItem = items.filter(
        (item) =>
          item.offerPrice >= lowerPrice && item.offerPrice <= higherPrice,
      );
      return res.json(priceItem);
    }else if(lowerPrice === 0, higherPrice === 0){
      return res.json(items)
    }
     else {
      res.status(400).json({ message: "error" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
      { new: true },
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
      { new: true },
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

App.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const {
      productName,
      category,
      rating,
      price,
      offerPrice,
      offerPercentage,
    } = req.body;

    console.log("add-product payload:", req.body, req.file);

    const imageUrl = req.file ? `itemImage/${req.file.filename}` : null;

    const product = await Item.create({
      productName,
      category,
      rating,
      price,
      offerPrice,
      offerPercentage,
      imageUrl: imageUrl,
    });

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
App.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
