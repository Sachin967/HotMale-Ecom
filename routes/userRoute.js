const express = require('express')
const userController = require('../controller/userController')
const user = express()
require('dotenv').config()
const User = require('../model/model')

const forLogin =  ((req,res,next)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if(req.session.loggedIn)
      res.redirect('/')
  else
      next();
}) 

const reEstablish = ((req,res,next)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  next()
})


const restrict = (async (req,res,next)=>{
  req.session.previousUrl = '/'
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  console.log('Is Logged In:', req.session.loggedIn);

  if(req.session.loggedIn){

      let userDat =     await User.findOne({email:req.session.userEmail})

      if (userDat && userDat.isBlocked === true) {
        res.redirect('/logout');
      } else {
        next();
      }
  }
  else    res.redirect('/login')
})


user.set('view engine','ejs')
user.set('views','./views/user')
user.use(express.static('views/user'))
user.use(express.static('public')) 

user.get('/',userController.loadHome)

user.get('/login',forLogin,userController.loadLogin)
user.post('/login',forLogin,userController.loginPost)
user.post('/otp-login',forLogin,userController.otpLoginPost)
user.post('/otp-verify',forLogin,userController.otpVerifyPost)
user.get('/logout',userController.logout)

user.get('/signup',forLogin,userController.loadSignup)
user.post('/signup',forLogin,userController.signupPost)


user.get('/products',reEstablish,userController.viewProducts)
user.get('/productdetails',reEstablish,userController.productDetails)
user.get('/my-profile',restrict,userController.ProfileGet)
user.post('/my-profile',restrict,userController.Editprofile)
user.get('/getaddress',restrict,(req,res)=>{res.render('viewaddress')})
user.post('/postaddress',restrict,userController.addAddress)

user.get('/getcart',restrict,userController.getCart)
user.post('/addtocart',restrict,userController.addToCart)
user.get('/loadcart',restrict,userController.loadCart)

module.exports = user
