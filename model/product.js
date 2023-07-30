// product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  pname: {
    type: String,
    required: true
  },
  category: {
    type: String,
    ref: 'Category', // This refers to the Category model
    required: true,
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  img1: {
    type: String,
    required: false
  },
  img2: {
    type: String,
    required: false
  },
  img3: {
    type: String,
    required: false
  },
  img4: {
    type: String,
    required: false
  },
  stock: {
    type: Number,
    required: true
  },
  isListed:{
    type:Boolean,
    default:true
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
