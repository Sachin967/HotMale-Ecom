const User = require("../model/model");
const bcrypt = require("bcrypt");
require("dotenv").config();
const Product = require("../model/product");
const user = require("../routes/userRoute");
const Cart = require("../model/cartModel");
const Coupon = require('../model/coupon')
const Banner = require('../model/banner')
const Order = require('../model/ordersM')
const Category = require('../model/categorymodel')
const easyinvoice = require('easyinvoice');


const accountSid = process.env.TWILIO_AUTH_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);

const loadHome = async (req, res) => {
  try {
    if(req.session.loggedIn){}
    const loggedIn = req.session.loggedIn;
   
    const banners = await Banner.find({isActive:true})
    const allCategories = await Category.find();
    const listedCategories = allCategories.filter((category) => category.isListed);
    let cartProductCount = 0;
    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }

    const products = await Product.find().limit(8);
    res.render("home", { products, loggedIn, cartProductCount,banners,category: listedCategories });
  } catch (error) {
    console.log(error.message);
  }
};

const loadSignup = async (req, res) => {
  try {
    res.locals.pageTitle = "Register";
    res.render("signup");
  } catch (error) {
    console.log(error);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.locals.pageTitle = "Login";
    res.render("login");
  } catch (error) {
    console.log(error);
  }
};
const loginPost = async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.password;

    const userDetails = await User.findOne({ email: email });
   
    if (userDetails == null) {
      res.render("login", { error: true, msg: "Invalid email or password" });
    } else {
      try {
        if (await bcrypt.compare(pass, userDetails.password)) {
          if (userDetails.isBlocked) {
            res.render("login", { msg: "You are Blocked" });
          }
          if(!userDetails.referralCode){
            const referralCode = generateReferralCode();

            // Update the user's document with the referral code
            userDetails.referralCode = referralCode;
            await userDetails.save();
          }
          // Setting Session
          req.session.userId = userDetails._id.toString();
          req.session.userEmail = req.body.email;
          req.session.loggedIn = true;
          req.session.user = await User.findOne({ email: req.body.email });
          // req.session.successMessage = "Login successful!"
          res.redirect("/?success=true");
        } else {
         
          res.render("login", {error: true, msg: "Invalid email or password" });
        }
      } catch (error) {
        console.log(error.message);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const otpLoginget = async (req, res) => {
  try {
    res.locals.pageTitle = "otp login";
    res.render("otp-login");
  } catch (error) {
    console.log(error.message);
  }
};

const forgotpass = async (req, res) => {
  try {
    const mobile = req.body.mobile;
    const user = await User.findOne({ mobile: mobile });

    if (!user) {
      return res.render("login", {
        msg: "User not found. Please register or try a different mobile number.",
      });
    }
    client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobile}`, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);
        res.render("verifyForgotpass", { mobile: mobile });
      })

      .catch((error) => {
        console.error("Error sending message:", error);
        res.render("login", { otpError: true, msg: "Error sending OTP" });
      });
  } catch (error) {
    console.log(error.message);
  }
};

const forgotpassVerify = async (req, res) => {
  try {
    const otp = req.body.otp;
    const mobile = req.body.mobile;

    const user = await User.findOne({ mobile: mobile });
    if (!user) {
      return res.render("login", {
        msg: "User not found. Please register or try again.",
      });
    }

    if (user.isBlocked) {
      return res.render("login", { msg: "You are Blocked" });
    }
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${mobile}`, code: otp })
      .then((verification_check) => {
        console.log(verification_check.status);
        res.render("setpassword", { mobile: mobile });
      });
  } catch (error) {
    console.log(error.message);
  }
};

const setNewPassword = async (req, res) => {
  try {
    const newPassword = req.body.newPassword;
    const mobile = req.body.mobile;
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required." });
    }
   
    const user = await User.findOne({ mobile: mobile });

    if (!user) {
      console.log("user not found");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password with the hashed password
    await User.findOneAndUpdate(
      { mobile: mobile },
      { password: hashedPassword }
    );
    await user.save();

    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update password." });
  }
};

const otpLoginPost = async (req, res) => {
  try {
    const mobile = req.body.mobile;
    const user = await User.findOne({ mobile: mobile });
    
    if (!user) {
      return res.render("login", {
        msg: "User not found. Please register or try a different mobile number.",
      });
    }

    client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobile}`, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);
        res.render("otp-login", { mobile: mobile });
      })

      .catch((error) => {
        console.error("Error sending message:", error);
        res.render("login", { otpError: true, msg: "Error sending OTP" });
      });
  } catch (error) {
    console.log(error);
    res.render("login", { otpError: true, msg: "Error sending OTP" });
  }
};

const otpVerifyPost = async (req, res) => {
  try {
    const otp = req.body.otp;
    const mobile = req.body.mobile;

    const user = await User.findOne({ mobile: mobile });
    if (!user) {
      return res.render("login", {
        msg: "User not found. Please register or try again.",
      });
    }

    if (user.isBlocked) {
      return res.render("login", { msg: "You are Blocked" });
    }
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${mobile}`, code: otp })
      .then((verification_check) => {
        if(verification_check.status==='approved'){
        console.log(verification_check.status);

        req.session.userId = user._id.toString();
        req.session.loggedIn = true;
        res.redirect("/");}
        else{
          res.render('login',{msg:'Invalid otp'})
        }
      });
  } catch (error) {
    console.log(error.message);
  }
};

function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
}

const signupPost = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.cpassword;

    // const userDetails = await User.findOne({ email: req.body.email });
    const count = await User.findOne({ email: req.body.email }).count();

    if (count !== 0) {
      res.render("signup", { error: true, msg: "Email already exists. Login instead." });
    } else {
      if (password === confirmPassword) {
        const passwordHashed = await bcrypt.hash(password, 10);

        let referralCode = req.body.enteredReferralCode; // Get entered referral code from the request

        // Check if the entered referral code is valid and find the referring user
        const referringUser = await User.findOne({ referralCode: referralCode });

        if (!referralCode || referringUser) {
          // Generate a unique referral code for the user
          referralCode = generateReferralCode(); // Assuming you have a function to generate referral codes

          const userReferral = {
            referredUserId: null, // The referred user hasn't signed up yet
            dateReferred: new Date(),
          };

          if (referringUser) {
            userReferral.referredUserId = referringUser._id; // Store the ID of the referring user
          }

          const registerEmployee = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: passwordHashed,
            referralCode: referralCode, // Store the user's unique referral code
            referrals: [userReferral], // Store the referral relationship
          });

          const registered = await registerEmployee.save();

          if (referringUser) {
            // Add referral bonuses to the wallets
            const referralBonusAmount = 50; // Adjust this amount as needed
            referringUser.wallet.push({ amount: referralBonusAmount, type: 'Credited' });
            registerEmployee.wallet.push({ amount: referralBonusAmount, type: 'Credited' });

            await referringUser.save();
            await registerEmployee.save();
          }

          res.status(201).redirect("/login");
        } else {
          res.render("signup", { error: true, msg: "Invalid referral code." });
        }
      } else {
        res.render("signup", { error: true, msg: "Password confirmation incorrect." });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};


const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) console.log("Error loging out : ", err);
      else res.redirect("/login");
    });
  } catch (error) {
    console.log(error.message);
  }
};

const viewProducts = async (req, res) => {
  try {
    const loggedIn = req.session.loggedIn;
    const userId = req.session.userId
    const page = parseInt(req.query.page) || 1;
    const perPage = 8;
    let query = { isListed: true };
   
    const allCategories = await Category.find();
    const listedCategories = allCategories.filter((category) => category.isListed);

    const category = req.query.category;
    if (category) {
      const categoryDocument = await Category.findOne({ categorytitle: category, isListed: true });
      if(categoryDocument){

        query.category = category;
      }else{
        query.category = '';
        
      }
    }
    const priceFilter = req.query.priceFilter;
    if (priceFilter === "under-2000") {
      query.price = { $lte: 2000 };
    } else if (priceFilter === "under-5000") {
      query.price = { $lte: 5000 };
    } else if (priceFilter === "under-10000") {
      query.price = { $lte: 10000 };
    } else if (priceFilter === "over-10000") {
      query.price = { $gt: 10000 };
    }

    const search = req.query.search;
    if (search) {
      // Use a regular expression to perform a case-insensitive search on both name and description fields
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.pname = { $regex: escapedSearch, $options: "i" };
    }
    let sortCriteria = {};
    const sortBy = req.query.sortBy;
    if (sortBy === "priceLowToHigh") {
      sortCriteria = { price: 1 };
    } else if (sortBy === "priceHighToLow") {
      sortCriteria = { price: -1 };
    }

  let cartProductCount= 0
    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);
    const products = await Product.find(query)
      .sort(sortCriteria)
      .skip((page - 1) * perPage)
      .limit(perPage);


 
    
    res.render("product", {
      products: products,
      currentPage: page,
      totalPages: totalPages,
      searchQuery: search,
      loggedIn,
      cartProductCount,
      sortBy,
      category:listedCategories,
      cartProductCount
    });
  } catch (error) {
    console.log(error.message);
  }
};


const productDetails = async (req, res) => {
  try {
    const loggedIn = req.session.loggedIn
    const productId = req.query.id;
    const product = await Product.findOne({ _id: productId });

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId } 
    });

    const userId = req.session.userId;

    const userCart = await Cart.findOne({ user: userId });

    let productInCart = false;

    if (userCart) {
      productInCart = userCart.products.some(cartProduct => {
        return cartProduct.product.toString() === productId;
      });
    }
    let cartProductCount = 0
    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }

    res.render("productdetails", { product: product, 
      userId: userId, productInCart: productInCart,
      relatedProducts,loggedIn ,cartProductCount});
  } catch (error) {
    console.log("Error:", error.message);
  }
};


const applyCoupon = async(req,res)=>{
  const couponCode = req.body.couponCode; // Assuming the coupon code is sent in the request body
    const userId = req.session.userId; // Assuming the user's ID is sent in the request body
   const cart = await Cart.findOne({user:userId})
   
    try {

      if (cart.appliedCoupon) {
        return res.status(400).json({ message: 'A coupon has already been applied to this order.' });
    }
        const coupon = await Coupon.findOne({ coupon:couponCode ,active: true});

          
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code.' });
        }
          const currentDate = new Date();
        if (currentDate < coupon.start || currentDate > coupon.validity) {
            return res.status(400).json({ message: 'Coupon is not valid at this time.' });
        }

        if (!coupon.usedBy) {
          coupon.usedBy = [];
      }

        // Check if the user has already used the coupon
        if (coupon.usedBy && coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already used this coupon.' });
        }

        if (cart.totalPrice < coupon.minprice || cart.totalPrice > coupon.maxprice) {
          return res.status(400).json({ message: 'Purchase total does not meet coupon conditions.' });
      }

        // Calculate the discounted amount
        const discountPercentage = coupon.percentage;
        const discountAmount = (discountPercentage / 100) * cart.totalPrice;
        const discountedTotal = cart.totalPrice - discountAmount

        // Deactivate the coupon if its validity has passed
        if (currentDate > coupon.validity) {
            coupon.active = false;
        }

        // Update the coupon document
        await coupon.save();
        cart.appliedCoupon = coupon._id;
        await cart.save();
        
        res.status(200).json({ message: 'Coupon successfully redeemed.', discountAmount, discountedTotal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while redeeming the coupon.' });
    }
}

const walletGet = async(req,res)=>{
  try {
    const loggedIn = req.session.loggedIn
    const userId = req.session.userId
    const user = await User.findById(userId)
    await user.save()

    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }
    
    res.render('mywallet',{user,loggedIn,cartProductCount})

  } catch (error) {
    console.log(error.message);
  }
}

function generateAndDownloadInvoice(res, order, product,user) {
  try {
    // Create an invoice object using easyinvoice
    const data = {
      currency: 'Rupees', // Change this to your preferred currency
      taxNotation: 'vat', // Change as needed
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      logo: './', // Replace with your company's logo URL
      sender: {
        company: 'HOT Male',
        address: '123 Main Street',
        city: 'Kayamkulam',
        zip: '12345',
        country: 'India',
        email: 'contact@yourcompany.com',
        phone: '+1 (123) 456-7890',
      },
      client: {
        company: order.userAddress.name, // Use the customer's name or company name
        address: order.userAddress.address,
        city: order.userAddress.city,
        zip: order.userAddress.pincode,
        country: order.userAddress.state,
        email: user.email, // Use the customer's email
        phone: user.mobile, // Use the customer's phone number
      },
      invoiceNumber: 'INV-001', // Replace with your invoice number
      invoiceDate: new Date().toLocaleDateString(), // Use the invoice date
      products: [
        {
          quantity: product.quantity,
          description: product.product.pname,
          tax: 0, 
          price: product.price,
        },
      ],
      bottomNotice: 'Thank you for your business!', // Customize the bottom notice
    };

    // Generate the invoice PDF
    easyinvoice.createInvoice(data, (result) => {
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice.pdf`);

      // Send the PDF to the response
      res.send(Buffer.from(result.pdf, 'base64'));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const downloadInvoice = async(req,res)=>{
  try {
    const orderId = req.params.orderId;
    const productIndex = parseInt(req.params.productIndex);

    // Fetch the order with the specified orderId
    const order = await Order.findById(orderId)
    .populate('user')
      .populate('products.product')
      .exec();

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Retrieve the selected product based on productIndex
    const selectedProduct = order.products[productIndex];

    if (!selectedProduct) {
      return res.status(404).send('Product not found');
    }
    const user = order.user

    generateAndDownloadInvoice(res, order, selectedProduct,user);

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');

  }
}


module.exports = {
  loadSignup,
  loadLogin,
  otpLoginPost,
  loginPost,
  otpLoginget,
  signupPost,
  otpVerifyPost,
  loadHome,
  logout,
  viewProducts,
  productDetails,
  forgotpass,
  forgotpassVerify,
  setNewPassword,
  applyCoupon,
  walletGet,
  downloadInvoice
};
