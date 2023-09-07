const AdminsModel = require("../model/admin");
const bcrypt = require("bcrypt");
const express = require("express");
const User = require("../model/model");
const Product = require("../model/product");
const Category = require("../model/categorymodel");
const sharp = require("sharp");
const fs = require("fs");
const Order = require("../model/ordersM");
const Coupon = require("../model/coupon");
const Banner = require('../model/banner')

const adminControl = {
  adminloginView: async (req, res) => {
    res.render("adminlogin", { error: false , message: "" }); // Pass an empty message initially
  },

  dashboardView: async (req, res) => {
    try {
      res.render("dashboard");
    } catch (error) {
      console.log("dash");
    }
  },

  adminloginPost: async (req, res) => {
    const email = req.body.email;
    const pass = req.body.password;
    const adminDetails = await AdminsModel.findOne({ email: email });
    if (adminDetails == null) {
      res.render("adminlogin", { error: true, msg: "Invalid Username or Password" });
    } else {
      try {
        if (await bcrypt.compare(pass, adminDetails.password)) {
          // Setting Session
          req.session.adminEmail = req.body.email;
          req.session.loggedIn = true;
          req.session.admin = true;

          res.redirect("/dashboard");
        } else {
          res.render("adminlogin", {error: true, msg: "Invalid Username or Password" });
        }
      } catch (error) {
        res.render("adminlogin", {error: true, msg: "Invalid Username or Password" });
      }
    }
  },

  usersView: async (req, res) => {
    try {
      const users = await User.find({}).sort({ _id: -1 });
      res.render("users", { users: users });
    } catch (error) {
      console.error(error);
      res.render("users", { users: [] }); // Render with empty users array or handle the error appropriately
    }
  },

  blockUsers: async (req, res) => {
    try {
      const id = req.query.id;
      await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
      res.redirect("/users");
    } catch (error) {
      console.log(error);
    }
  },

  unblockUsers: async (req, res) => {
    try {
      const id = req.query.id;
      await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
      res.redirect("/users");
    } catch (error) {
      console.log(error);
    }
  },

  viewProducts: async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.render("view-product", { products });
  },

  productAddget: async (req, res) => {
    const categories = await Category.find({});
    res.render("addproduct", { categories });
  },

  productAddpost: async (req, res) => {
    try {
      var images = [];
      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i] !== undefined) {
          images.push(req.files[i].filename);
        }
      }

      const category = await Category.findOne({ _id: req.body.category });
      if (!category) {
        console.log("Category not found");
        return res.redirect("/addproduct"); 
      }

      const price = parseFloat(req.body.price);
      const discountPercentage = parseFloat(req.body.discountPercentage);
      const offerPrice = price - (price * (discountPercentage / 100));

      const product = new Product({
        pname: req.body.pname,
        category: category.categorytitle,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        images: images,
        offerPrice: offerPrice,
        offerPercentage:discountPercentage,
        offerValidFrom: req.body.offerValidFrom, 
        offerValidUntil: req.body.offerValidUntil
      });
      const result = await product.save();
      res.redirect("/viewproducts");
    } catch (error) {
      console.log("Error processing images:", error);
      // Handle the error appropriately, e.g., show an error message or redirect to an error page
      res.redirect("/addproduct");
    }
  },

  adminLogout: async (req, res) => {
    req.session.destroy((err) => {
      if (err) console.log("Error loging out : ", err);
      else res.redirect("/adminlogin");
    });
  },

  addminGet: async (req, res) => {
    res.render("addmin");
  },

  addminPost: async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Await the hashing process

      const newAdmin = new AdminsModel({
        name: name,
        email: email,
        password: hashedPassword,
      });

      await newAdmin.save();

      res.redirect("/adminlogin");
    } catch (error) {
      console.error(error.message);

    }
  },

  orderGet: async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate("user") 
      res.render("orders", { orders });
    } catch (error) {
      console.log("not found");
    }
  },

  orderDetails: async(req,res)=>{
    try {
      const orderId = req.query.id
      const order = await Order.findById(orderId)
      .populate('user')
      .populate("products.product"); 
      res.render('moreDetails',{order})
    } catch (error) {
      console.log(error.message);
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const newStatus = req.body.status;
      const productIdToUpdate = req.body.product_id;
      const order = await Order.findById(orderId);
      console.log(productIdToUpdate);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const productToUpdate = order.products.find(product => product._id.toString() === productIdToUpdate);
      if (!productToUpdate) {
        return res.status(404).json({ message: "Product not found in order" });
      }
  
      productToUpdate.status = newStatus;
  
      if (newStatus === 'Delivered') {
        order.paymentStatus = 'Completed';
      }
  
      // Save the updated order
      await order.save();
      res.redirect("/ordermanage");
    } catch (error) {
      console.log(error.message);
    }
  },

  addCouponGet: async (req, res) => {
    res.render("addcoupon");
  },

  addCouponPost: async (req, res) => {
    try {
      const { coupon, startDate, validity, percentage,description ,min,max } = req.body;
      const existingCouponCount = await Coupon.countDocuments({ coupon: coupon });


      if (existingCouponCount !== 0) {
        res.render("addcoupon", { msg: "Coupon Already Exists" });
      }
      const coup = new Coupon({
        coupon: coupon,
        start: startDate,
        validity: validity,
        percentage: percentage,
        description:description,
        minprice:min,
        maxprice:max
      });

      await coup.save();
      res.redirect("/showcoupons");
    } catch (error) {
      console.log(error.message);
    }
  },

  showCoupons: async (req, res) => {
    try {
      const coupons = await Coupon.find().sort({ _id: -1 });
      res.render('view-coupons',{coupons});
    } catch (error) {
      console.log(error.message);
    }
  },

  editCoupons: async (req, res) => {
    const couponId = req.query.id;
    console.log(couponId);
    const coupon = await Coupon.findOne({ _id:couponId });
  
    res.render('edit-coupon',{coupon});
  },

  editCouponPost: async (req, res) => {
    try {
      const { couponId, coupon, startDate, validity, percentage, description,min,max} = req.body;
      const coupons = await Coupon.updateOne(
        { _id: couponId },
        {
          coupon: coupon,
          start: startDate,
          validity: validity,
          percentage: percentage,
          description:description,
          minprice:min,
          maxprice:max
        },
        { upsert: true }
      );
      res.redirect('/showcoupons')
    } catch (error) {
      console.log(error.message);
    }
  },

  deleteCoupon:async(req,res)=>{
    try {
      const couponId = req.query.id
      const coupon = await Coupon.deleteOne({_id:couponId})
      res.redirect('/showcoupons')
    } catch (error) {
      console.log(error.message);
    }
  },

  viewBanners:async(req,res)=>{
    try {
      const banner = await Banner.find()
      
      res.render('bannerlist',{banner})
    } catch (error) {
      console.log(error.message);
    }
  },

  addBanner:async(req,res)=>{
    try {
      
      res.render('addbanner')
    } catch (error) {
      console.log(error.message);
    }
  },

  addBannerPost: async (req, res) => {
    try {
      const { title, linkURL } = req.body;
      const imageUrl = req.file.filename;
      console.log(req.body);
      console.log(req.file);
      const newBanner = new Banner({
        title: title,
        linkURL: linkURL,
        imageUrls: [imageUrl]
      });
  
      await newBanner.save();
      console.log(newBanner);
      res.redirect('/getbanner');
    } catch (error) {
      console.log(error.message);
    }
  },

  activateBanner:async(req,res)=>{
    try {
      const bannerId = req.query.id
      const banner = await Banner.findByIdAndUpdate(bannerId,{isActive:true})
      res.redirect('/getbanner')
    } catch (error) {
      console.log(error.message);
    }
  },

  deactivateBanner:async(req,res)=>{
    try {
      const bannerId = req.query.id
      const banner = await Banner.findByIdAndUpdate(bannerId,{isActive:false})
      res.redirect('/getbanner')
    } catch (error) {
      console.log(error.message);
    }
  },

  geteditBanner:async(req,res)=>{
    try {
      const bannerId = req.query.id
      const banner = await Banner.findById(bannerId)
      res.render('editbanner',{banner})
    } catch (error) {
      console.log(error.message);
    }
  },

  posteditBanner:async(req,res)=>{
    try {
      const bannerId = req.query.id;
      const { title, linkURL } = req.body;
      const newImage = req.file ? req.file.filename : '';
      const removeImage = req.body.removeImage === 'true';
      console.log(bannerId);
      console.log(req.body);
      console.log(newImage);
      console.log(removeImage);

  
      // Fetch the existing banner data
      const existingBanner = await Banner.findById(bannerId);
  
      // Update the title and linkURL
      existingBanner.title = title;
      existingBanner.linkURL = linkURL;
  
      // Update the image URL if a new image is uploaded, otherwise keep the existing image
      if (removeImage) {
        existingBanner.imageUrls = []
      }else if (newImage) {
        existingBanner.imageUrls = [newImage]; // Update with the new image URL
      }
  
      // Save the updated banner data
      await existingBanner.save();
  
      res.redirect('/getbanner')
    } catch (error) {
      console.log(error.message);
    }
  },

  deleteBanner:async(req,res)=>{
    try {
      const bannerId = req.query.id
      const banner = await Banner.findByIdAndDelete(bannerId)
      if (banner) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: "Banner not found" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
  

};
module.exports = adminControl;
