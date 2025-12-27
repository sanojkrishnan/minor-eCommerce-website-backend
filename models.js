const mongoose = require("mongoose");

// Allow any structure (raw data)
const itemSchema = new mongoose.Schema({
    productName : String ,
    category : String ,
    rating : Number ,
    price : Number ,
    offerPrice : Number ,
    offerPercentage : Number ,
    imageUrl : String
});
const cartSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'item', required: true },
    quantity: { type: Number, default: 1, min: 1 },
});

// IMPORTANT: third argument = collection name
const Item = mongoose.model("item", itemSchema, "items");
const Cart = mongoose.model("cart", cartSchema, "carts");

module.exports = { Item, Cart };