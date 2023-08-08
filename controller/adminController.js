const AdminsModel = require('../model/admin')
const bcrypt = require('bcrypt')
const express = require('express');
const User = require('../model/model');
const Product = require('../model/product')
const Category = require('../model/categorymodel')
const sharp = require('sharp');
const fs = require('fs');
const Order = require('../model/ordersM')

const adminControl = {

  adminloginView: async (req, res) => {
    res.render('adminlogin', { message: '' }); // Pass an empty message initially
  },

dashboardView :async(req,res)=>{
try {
  res.render('dashboard')
} catch (error) {
  console.log('dash');
}
},

  adminloginPost: async (req, res) => {
    const email = req.body.email;
    const pass = req.body.password;
    const adminDetails = await AdminsModel.findOne({ email: email });
    if (adminDetails == null) {
      res.render('login', { error: true, msg: 'Invalid Username or Password' });
    } else {
      try {
        if (await bcrypt.compare(pass, adminDetails.password)) {
          // Setting Session
          req.session.adminEmail = req.body.email;
          req.session.loggedIn = true;
          req.session.admin = true;

          res.redirect('/dashboard')
        } else {
          res.render('login', { msg: 'Invalid Username or Password' });
        }
      } catch (error) {

      }
    }
  },


  usersView: async (req, res) => {
    try {
      const users = await User.find({}).sort({ _id: -1 });
      res.render('users', { users: users });
    } catch (error) {
      console.error(error);
      res.render('users', { users: [] }); // Render with empty users array or handle the error appropriately
    }
  },

  blockUsers: async (req, res) => {
    try {
      const id = req.query.id
      await User.updateOne({ _id: id }, { $set: { isBlocked: true } })
      res.redirect('/users')
    } catch (error) {
      console.log(error);
    }
  },

  unblockUsers: async (req, res) => {
    try {
      const id = req.query.id
      await User.updateOne({ _id: id }, { $set: { isBlocked: false } })
      res.redirect('/users')
    } catch (error) {
      console.log(error);
    }
  },

  viewProducts: async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 })
    res.render('view-product', { products })
  },

  productAddget: async (req, res) => {
    const categories = await Category.find({})
    res.render('addproduct', { categories })
  },


  
  productAddpost: async (req, res) => {
    var img1, img2, img3, img4;
  
    if (req.files[0] != undefined) img1 = req.files[0].filename;
    if (req.files[1] != undefined) img2 = req.files[1].filename;
    if (req.files[2] != undefined) img3 = req.files[2].filename;
    if (req.files[3] != undefined) img4 = req.files[3].filename;
  
    const category = await Category.findOne({ _id: req.body.category });
    if (!category) {
      console.log('Category not found');
      return res.redirect('/addproduct'); // Redirect to the add product page or handle the error appropriately
    }
  
    const product = new Product({
      pname: req.body.pname,
      category: category.categorytitle,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      img:img1,
      img2:img2,
      img3:img3,
      img4:img4
    });
  
    try {
      // Process and save the resized images if they were uploaded
      // if (img1) {
      //   const resizedImg1 = await sharp(`./public/uploads/products/${img1}`).resize(300).toBuffer();
      //   // Save the resized image back to the variable
      //   img1 = `resized-${img1}`;
      //   await fs.promises.writeFile(`./public/uploads/products/${img1}`, resizedImg1);
      // }
  
      // if (img2) {
      //   const resizedImg2 = await sharp(`./public/uploads/products/${img2}`).resize(300).toBuffer();
      //   img2 = `resized-${img2}`;
      //   await fs.promises.writeFile(`./public/uploads/products/${img2}`, resizedImg2);
      // }
  
      // if (img3) {
      //   const resizedImg3 = await sharp(`./public/uploads/products/${img3}`).resize(300).toBuffer();
      //   img3 = `resized-${img3}`;
      //   await fs.promises.writeFile(`./public/uploads/products/${img3}`, resizedImg3);
      // }
  
      // if (img4) {
      //   const resizedImg4 = await sharp(`./public/uploads/products/${img4}`).resize(300).toBuffer();
      //   img4 = `resized-${img4}`;
      //   await fs.promises.writeFile(`./public/uploads/products/${img4}`, resizedImg4);
      // }
  
      // // Assign the filenames to the product object
      // product.img1 = img1;
      // product.img2 = img2;
      // product.img3 = img3;
      // product.img4 = img4;
  
      // Save the product to the database
      const result = await product.save();
      res.redirect('/viewproducts');
    } catch (error) {
      console.log('Error processing images:', error);
      // Handle the error appropriately, e.g., show an error message or redirect to an error page
      res.redirect('/addproduct');
    }
  },
  


  adminLogout: async (req, res) => {
    req.session.destroy((err) => {
      if (err) console.log("Error loging out : ", err)
      else res.redirect('/adminlogin')
    })
  },

  addminGet: async (req, res) => {
    res.render('addmin')
  },

  addminPost: async (req, res) => {
    const { name, email, password } = req.body
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Await the hashing process

      const newAdmin = new AdminsModel({
        name: name,
        email: email,
        password: hashedPassword,
      });

      await newAdmin.save();

      res.redirect('/adminlogin')

    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while adding the new admin.');
    }
  },

  orderGet : async(req,res)=>{
    try {
      const orders = await Order.find().populate('user')
      console.log(orders);
      res.render('orders',{orders})
    } catch (error) {
      console.log("not found");
    }
  },


  updateOrderStatus : async(req,res)=>{
    try {
      const orderId = req.params.orderId;
      const newStatus = req.body.status;
       console.log(orderId);
        const order = await Order.findById(orderId);
    
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
    
        // Update the orderStatus
        order.status = newStatus;
    
        // Save the updated order
        await order.save();
    
    } catch (error) {
      console.log(error.message);
    }
  }


}
module.exports = adminControl;
