const User = require('../model/model')
const bcrypt = require('bcrypt')
require('dotenv').config();
const Product = require('../model/product');
const user = require('../routes/userRoute');
const Cart = require('../model/cartModel')
const mongoose = require('mongoose')


const accountSid = "ACa74d7819828621b6024733854ca5c7a6";
const authToken = "42de57c6ff9cbc406ed8f29c714c51e8";
const verifySid = "VA83a3ba969f629a14317f545e245e56a0";
const client = require('twilio')(accountSid, authToken);

const loadHome = async (req, res) => {
  try {
    const products = await Product.find().limit(8)
    res.render('home', { products })
  } catch (error) {
    console.log(error);
  }
}

const loadSignup = async (req, res) => {
  try {
    res.locals.pageTitle = 'Register'
    res.render('signup')
  } catch (error) {
    console.log(error);
  }
}

const loadLogin = async (req, res) => {
  try {
    res.locals.pageTitle = 'Login'
    res.render('login')
  } catch (error) {
    console.log(error);
  }
}
const loginPost = async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.password;

    const userDetails = await User.findOne({ email: email });
    if (userDetails == null) {
      res.render('login', { error: true, msg: 'Invalid email or password' });
    } else {
      try {
        if (await bcrypt.compare(pass, userDetails.password)) {
          if (userDetails.isBlocked) {
            res.render('login', { msg: 'You are Blocked' });
          }
          // Setting Session
          req.session.userId = userDetails._id.toString();
          req.session.userEmail = req.body.email;
          req.session.loggedIn = true;
          req.session.user = await User.findOne({ email: req.body.email })

          if (userDetails.email == 'admin@gmail.com') {
            req.session.admin = true;
            res.redirect('admin')
          }
          else {
            req.session.admin = false;
            if (req.session.previousUrl != undefined) res.redirect(req.session.previousUrl)
            else res.redirect('/signup')
          }
        } else {
          res.render('login', { msg: 'Invalid email or password' });
        }
      } catch (error) {

      }
    }
  } catch (error) {

  }
};

const otpLoginget = async (req, res) => {
  try {
    res.locals.pageTitle = 'otp login'
    res.render('otp-login')
  } catch (error) {
    console.log(error.message);
  }
}




const otpLoginPost = async (req, res) => {
  try {
    const mobile = req.body.mobile;
    const user = await User.findOne({ mobile: mobile });
    console.log(mobile);
    if (!user) {
      return res.render('login', { msg: 'User not found. Please register or try a different mobile number.' });
    }


    client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobile}`, channel: 'sms' })
      .then((verification) => {
        console.log(verification.status)
        res.render('otp-login', { mobile: mobile });
      })

      .catch(error => {
        console.error('Error sending message:', error)
        res.render('login', { otpError: true, msg: 'Error sending OTP' });
      })

  } catch (error) {
    console.log(error);
    res.render('login', { otpError: true, msg: 'Error sending OTP' });
  }
};

const otpVerifyPost = async (req, res) => {
  try {
    const otp = req.body.otp;
    const mobile = req.body.mobile;

    const user = await User.findOne({ mobile: mobile });
    if (!user) {
      return res.render('login', { msg: 'User not found. Please register or try again.' });
    }

    if (user.isBlocked) {
      return res.render('login', { msg: 'You are Blocked' });
    }
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${mobile}`, code: otp })
      .then((verification_check) => {
        console.log(verification_check.status);

        req.session.userId = user._id.toString();
        req.session.loggedIn = true;
        res.redirect('/')
      })
  } catch (error) {
    console.log(error.message);
  }

};



const signupPost = async (req, res) => {
  try {
    const password = req.body.password
    const confirmPassword = req.body.cpassword

    const userDetails = await User.findOne({ email: req.body.email })
    const count = await User.findOne({ email: req.body.email }).count()

    if (count !== 0) {
      res.render('signup', { error: true, msg: "Email already exists login" })
    } else {
      if (password === confirmPassword) {
        const passwordHashed = await bcrypt.hash(password, 10)
        const registerEmployee = new User({
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          password: passwordHashed
        })
        const registered = await registerEmployee.save()
        req.session.userEmail = req.body.email;
        req.session.loggedIn = true;
        req.session.admin = false;
        req.session.user = await User.findOne({ email: req.body.email })

        res.status(201).redirect('/login')
      } else {
        res.render('signup', { error: true, msg: "password incorrect" })
      }
    }
  } catch (error) {
    console.log(error);
  }
}


const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) console.log("Error loging out : ", err)
      else res.redirect('/login')
    })
  } catch (error) {
    console.log(error);
  }
}

const viewProducts = async (req, res) => {
  try {

    const products = await Product.find()
    if (products.some(product => product.isListed)) {
      res.render('product', { products: products });
    } else {
      console.log("kanunilla");
    }
  } catch (error) {
    console.log(error);
  }
}

const productDetails = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findOne({ _id: id })

    const userId = req.session.userId
    res.render('productdetails', { product: product, userId: userId })
  } catch (error) {
    console.log('vannila');
  }
}

const ProfileGet = async (req, res) => {
  try {
    console.log(req.session.userEmail);
    let userDetails = await User.findOne({ email: req.session.userEmail })

    if (userDetails == null) throw 'user not logined'

    // const addresses = await AddressModel.find({ userId: userDetails._id }).sort({ date: -1 })
    // res.status(200).json({ success: true, data: userDetails });
    res.render('userprofile', { user: userDetails });
  } catch (error) {
    res.redirect('/login')
  }
}

const Editprofile = async (req, res) => {
  try {
    let userDetails = await User.findOne({ email: req.session.userEmail })
    if (userDetails == null) throw 'User not loggedin'

    let emailCount = await User.countDocuments({
      _id: { $ne: userDetails._id },
      email: req.body.email,
    });

    if (emailCount > 0) {
      throw 'Email already exists';
    }

    const updated = await User.updateOne({ _id: userDetails._id }, {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile
    })

    res.status(200).json({
      success: true,
      message: 'Edited Successfully',
      data: updated
    })

  } catch (error) {
    res.status(200).json({ success: true, message: error })
  }
}

const addAddress = async (req, res) => {
  try {
    let userDetails = await User.findOne({ email: req.session.userEmail })
    if (userDetails === null) throw 'User not found'

    const newAddress = {
      name: req.body.name,
      mobile: req.body.mobile,
      pincode: req.body.pincode,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark,
      district: req.body.district
    }

    userDetails.address.push(newAddress)

    await userDetails.save()
    res.status(200).json({ success: true, message: 'Address added successfully' });

    console.log(userDetails.address);
  } catch (error) {
    console.log(error.message);
  }
}

const getCart = async (req, res) => {
  try {
    res.render('cart')
  } catch (error) {

  }
}
const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you have the authenticated user ID in the session
    const productId = req.query.productId; // Assuming you're using query parameters for the product ID

    // Check if the product ID is valid
    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Call the addCart function

    const addCart = async (productId, userId) => {
      try {
        const product = await Product.findOne({ _id: productId });
        if (!product) {
          throw new Error('Product not found');
        }

        const cart = await Cart.findOne({ user: userId });

        if (cart) {
          const existingProduct = cart.products.find((p) => p.product.equals(productId));
          if (existingProduct) {
            await Cart.updateOne(
              { user: userId, 'products.product': productId },
              {
                $inc: {
                  'products.$.quantity': 1,
                  'products.$.price': product.price,
                  totalPrice: product.price,
                },
                $set: { totalPrice: cart.totalPrice + product.price },
              }
            );
            const updatedCart = await Cart.findOne({ user: userId });
            return { status: true, cart: updatedCart };
          } else {
            const productObj = {
              product: productId,
              quantity: 1,
              price: product.price,
            };
            await Cart.updateOne(
              { user: userId },
              {
                $push: { products: productObj },
                $inc: { totalPrice: product.price },
              }
            );
          }
        } else {
          const productObj = {
            product: productId,
            quantity: 1,
            price: product.price,
          };
          const newCart = await Cart.create({
            user: userId,
            products: [productObj],
            totalPrice: product.price,
          });
        }
        const updatedCart = await Cart.findOne({ user: userId });
        return { status: true };
      } catch (error) {
        console.log(error.message);
        throw error;
      }
    };
    const response = await addCart(productId, userId);
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log(userId);
    console.log("userId:", userId, typeof userId);

    const cart = await Cart.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "carted"
        }
      },
      {
        $project: {
          item: "$products.product",
          quantity: "$products.quantity",
          price: "$products.price",
          carted: { $arrayElemAt: ["$carted", 0] }
        }
      }
    ]);
    console.log(cart);
    let count = 0;
    let cartTotal = 0;

    if (cart.length > 0) {
      count = cart.length;

      const total = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });

      if (total) {
        cartTotal = total.totalPrice;
      }
    }
    console.log(cart);
    res.render('cart', { cart, userId, count, cartTotal });
  } catch (error) {
    console.log(error);
    res.send({ success: false, error: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = res.session.userId;

    const data = req.body;
    const cartId = data.cartId;
    const proId = data.proId;
    const count = data.count;
    const quantity = data.quantity;
    const product = await Product.findOne({ _id: proId });

    if (count === -1 && quantity === 1) {
      await Cart.findOneAndUpdate(
        { _id: cartId, "cartItems.productId": proId },
        {
          $pull: { cartItems: { productId: proId } },
          $inc: { cartTotal: product.price * count }
        },
        { new: true }
      );
    } else {
      await Cart.updateOne(
        { _id: cartId, "cartItems.productId": proId },
        {
          $inc: {
            "cartItems.$.quantity": count,
            "cartItems.$.total": product.price * count,
            cartTotal: product.price * count
          },
        }
      );

      const cart = await Cart.findOne(
        { _id: cartId, "cartItems.productId": proId },
        { "cartItems.$": 1, cartTotal: 1 }
      );

      const newQuantity = cart.cartItems[0].quantity;
      const newSubTotal = cart.cartItems[0].total;
      const cartTotal = cart.cartTotal;
      res.json({ status: true, newQuantity, newSubTotal, cartTotal });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'An error occurred' });
  }
};



module.exports = {
  loadSignup, loadLogin,
  otpLoginPost, loginPost, otpLoginget,
  signupPost, otpVerifyPost, loadHome,
  logout, viewProducts, productDetails,
  ProfileGet, Editprofile, addAddress,
  getCart, addToCart, loadCart
}