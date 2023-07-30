const mongoose = require('mongoose');

// Define the Order schema
const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  qnty: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending',
  },
  trackingNumber: {
    type: String,
  },
  shippingCarrier: {
    type: String,
  },
  additionalNotes: {
    type: String,
  },
  cancelled: {
    isCancelled: { type: Boolean, default: false },
    reason: { type: String },
    refundedAmount: { type: Number, default: 0 },
  },
  statusHistory: [
    {
      status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'] },
      date: { type: Date, default: Date.now },
    },
  ],
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
