const mongoose = require("mongoose");

// Allow any structure (raw data)
const itemSchema = new mongoose.Schema({}, { strict: false });

// IMPORTANT: third argument = collection name
const Item = mongoose.model("item", itemSchema, "items");

module.exports = Item;
