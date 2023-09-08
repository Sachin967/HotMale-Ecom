const Address = require('../model/address')
const User = require('../model/model')
const Cart = require('../model/cartModel')
const asyncHandler = require('express-async-handler');
const { loginPost } = require('./userController');

const profileControl = {

  ProfileGet: asyncHandler(async (req, res) => {

    const loggedIn = req.session.userId

    const userDetails = await User.findOne({ _id: req.session.userId });

    if (!userDetails) {
      throw new Error('User not logged in');
    }
    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }

    res.render('userprofile', { user: userDetails,loggedIn,cartProductCount });
  }),

  Editprofile: asyncHandler(async (req, res) => {

    const userDetails = await User.findOne({ email: req.session.userEmail });

    if (!userDetails) {
      throw new Error('User not logged in');
    }

    const emailCount = await User.countDocuments({
      _id: { $ne: userDetails._id },
      email: req.body.email,
    });

    if (emailCount > 0) {
      throw new Error('Email already exists');
    }

    await User.updateOne(
      { _id: userDetails._id },
      {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Edited Successfully',
    });
  }),

  addAddress: asyncHandler(async (req, res) => {

    const { checkout } = req.query;
    const id = req.session.userId;
    const { name, mobile, landmark, city, district, state, pincode, address } = req.body;
    const data = new Address({
      name,
      mobile,
      landmark,
      district,
      state,
      pincode,
      address,
      city,
      userId: id,
    });

    await data.save();
    res.json({success:true, message: 'Address added successfully.' });
  }),

  getAllAddresses: asyncHandler(async (req, res) => {
    const loggedIn = req.session.loggedIn
    const id = req.session.userId;
    const user = await User.findById(id)
    const addresses = await Address.find({ userId: id });
    if (loggedIn) {
      const userId = req.session.userId;
      const cart = await Cart.findOne({ user: userId });

      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }
    res.render('viewaddress', { addresses,loggedIn,cartProductCount,user });
  }),

  getEditAddressPage: asyncHandler(async (req, res) => {

    const addressId = req.params.id;
    const address = await Address.findById(addressId);
    const userId = req.session.userId
    const loggedIn = req.session.loggedIn
    const user = await User.findById(userId)
    if (loggedIn) {
      const userId = req.session.userId;
      const cart = await Cart.findOne({ user: userId });

      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    
    res.render('editaddress', { address,loggedIn,user,cartProductCount });
  }),

  editAddress: asyncHandler(async (req, res) => {

    const addressId = req.params.id;
    const { name, mobile, landmark, city, district, state, pincode, address } = req.body;

    const updatedAddress = await Address.findByIdAndUpdate(addressId, {
      name,
      mobile,
      landmark,
      city,
      district,
      state,
      pincode,
      address,
    }, { new: true });

    if (!updatedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    res.status(200).json({ success: true, message: 'Address updated successfully.' });
  }),

  deleteAddress: asyncHandler(async (req, res) => {

    const { addressId } = req.query;

    await Address.deleteOne({ _id: addressId });

    res.status(200).json({ success: true });
  }),
};

module.exports = profileControl;



