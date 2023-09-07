const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categorytitle: {
    type: String,
    required: true,
  },

  offerPercentage: {
    type: Number,
    default: 0,
  },
  isListed: {
    type: Boolean,
    default: true
  }
});

const Category = new mongoose.model("Category", CategorySchema);

module.exports = Category;
