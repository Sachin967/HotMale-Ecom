const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrls: [{ type: String, required: true }],
  linkURL: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
