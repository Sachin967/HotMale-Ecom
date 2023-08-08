const User = require("../model/model");
const bcrypt = require("bcrypt");
require("dotenv").config();
const Product = require("../model/product");
const user = require("../routes/userRoute");
const Cart = require("../model/cartModel");
const mongoose = require("mongoose");
const cartHelper = require("../helper/carthelper");
const Order = require("../model/ordersM");
const Address = require("../model/address");

const accountSid = "ACa74d7819828621b6024733854ca5c7a6";
const authToken = "96231f76053172fe52ef331a9ae65415";
const verifySid = "VA83a3ba969f629a14317f545e245e56a0";
const client = require("twilio")(accountSid, authToken);

const loadHome = async (req, res) => {
  try {
    const loggedIn = req.session.loggedIn;
    const userName = loggedIn ? req.session.user.name : null;
    let cartProductCount = 0;
    if (loggedIn) {
      const userId = req.session.userId;

      // Fetch the cart for the logged-in user
      const cart = await Cart.findOne({ user: userId });

      // Calculate the total count of products in the cart
      if (cart) {
        cartProductCount = cart.products.reduce(
          (total, product) => total + product.quantity,
          0
        );
      }
    }

    const products = await Product.find().limit(8);
    res.render("home", { products, loggedIn, userName, cartProductCount });
  } catch (error) {
    console.log(error);
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
    console.log(userDetails);
    if (userDetails == null) {
      res.render("login", { error: true, msg: "Invalid email or password" });
    } else {
      try {
        if (await bcrypt.compare(pass, userDetails.password)) {
          if (userDetails.isBlocked) {
            res.render("login", { msg: "You are Blocked" });
          }
          // Setting Session
          req.session.userId = userDetails._id.toString();
          req.session.userEmail = req.body.email;
          req.session.loggedIn = true;
          req.session.user = await User.findOne({ email: req.body.email });
          res.redirect("/");
        } else {
          console.log("hii");
          res.render("login", { msg: "Invalid email or password" });
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
    console.log(mobile, "jjj");
    const user = await User.findOne({ mobile: mobile });

    if (!user) {
      console.log("user not found");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log(hashedPassword);
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
    const mobile = req.query.mobile;
    const user = await User.findOne({ mobile: mobile });
    console.log(mobile);
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
        console.log(verification_check.status);

        req.session.userId = user._id.toString();
        req.session.loggedIn = true;
        res.redirect("/");
      });
  } catch (error) {
    console.log(error.message);
  }
};

const signupPost = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.cpassword;

    const userDetails = await User.findOne({ email: req.body.email });
    const count = await User.findOne({ email: req.body.email }).count();

    if (count !== 0) {
      res.render("signup", { error: true, msg: "Email already exists login" });
    } else {
      if (password === confirmPassword) {
        const passwordHashed = await bcrypt.hash(password, 10);
        const registerEmployee = new User({
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          password: passwordHashed,
        });
        const registered = await registerEmployee.save();
        // req.session.userEmail = req.body.email;
        // req.session.loggedIn = true;
        // req.session.admin = false;
        // req.session.user = await User.findOne({ email: req.body.email })

        res.status(201).redirect("/login");
      } else {
        res.render("signup", { error: true, msg: "password incorrect" });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) console.log("Error loging out : ", err);
      else res.redirect("/login");
    });
  } catch (error) {
    console.log(error);
  }
};

const viewProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 4;
    let query = { isListed: true };

    const category = req.query.category;
    if (category) {
      // If a category is provided, add it to the query
      query.category = category;
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
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortBy = req.query.sortBy;
    if (sortBy === "priceLowToHigh") {
      query = { ...query }.sort({ price: 1 });
    } else if (sortBy === "priceHighToLow") {
      query = { ...query }.sort({ price: -1 });
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);
    console.log(query);
    const products = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const loggedIn = req.session.loggedIn;
    let cartProductCount = 0;
    if (loggedIn) {
      const userId = req.session.userId;

      const cart = await Cart.findOne({ user: userId });

      if (cart) {
        cartProductCount = cart.products.reduce(
          (total, product) => total + product.quantity,
          0
        );
      }
    }
    res.render("product", {
      products: products,
      currentPage: page,
      totalPages: totalPages,
      searchQuery: search,
      loggedIn,
      cartProductCount,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const productDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id });

    const userId = req.session.userId;

    res.render("productdetails", { product: product, userId: userId });
  } catch (error) {
    console.log("vannila");
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you have the authenticated user ID in the session
    const productId = req.query.productId; // Assuming you're using query parameters for the product ID

    // Check if the product ID is valid
    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Call the addCart function

    const addCart = async (productId, userId) => {
      try {
        const product = await Product.findOne({ _id: productId });
        if (!product) {
          throw new Error("Product not found");
        }

        const cart = await Cart.findOne({ user: userId });

        if (cart) {
          const existingProduct = cart.products.find((p) =>
            p.product.equals(productId)
          );
          if (existingProduct) {
            await Cart.updateOne(
              { user: userId, "products.product": productId },
              {
                $inc: {
                  "products.$.quantity": 1,
                  "products.$.price": product.price,
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
    res.status(500).json({ error: "An error occurred" });
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cart = await Cart.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "carted",
        },
      },
      {
        $project: {
          item: "$products.product",
          quantity: "$products.quantity",
          price: "$products.price",
          carted: { $arrayElemAt: ["$carted", 0] },
        },
      },
    ]);

    let count = 0;
    let cartTotal = 0;

    if (cart.length > 0) {
      count = cart.length;

      const total = await Cart.findOne({
        user: new mongoose.Types.ObjectId(userId),
      });

      if (total) {
        cartTotal = total.totalPrice;
      }
    }

    res.render("cart", { cart, userId, count, cartTotal });
  } catch (error) {
    console.log(error);
    res.send({ success: false, error: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;

    const response = await cartHelper.updateQuantity(req.body);

    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const response = await cartHelper.deleteProduct(req.body);
    res.send(response);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while deleting the product." });
  }
};

const loadCheckout = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const addresses = await Address.find({ userId: user._id });
    const cartItems = await Cart.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(req.session.userId) },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          product: { $toObjectId: "$products.product" },
          quantity: "$products.quantity",
          price: "$products.price",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "carted",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          price: 1,
          carted: { $arrayElemAt: ["$carted", 0] },
        },
      },
    ]);
    const totalPrice = cartItems.reduce((acc, cartItem) => {
      return acc + cartItem.price * cartItem.quantity;
    }, 0);

    console.log(cartItems);
    res.render("checkout", { user, cartItems, addresses, totalPrice });
  } catch (error) {
    console.log(error.message);
    res.redirect("/cart");
  }
};

const processCheckout = async (req, res) => {
  try {
    const { paymentMethod, deliveryAddress } = req.body; // Correct property name
    const addressId = new mongoose.Types.ObjectId(deliveryAddress);

    const userId = req.session.userId;
    console.log(addressId);
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(400).json({ error: "Selected address not found." });
    }

    const cartItems = await Cart.findOne({ user: userId });
    if (!cartItems || cartItems.products.length === 0) {
      return res.redirect("/loadcart");
    }

    for (const cartProduct of cartItems.products) {
      const product = await Product.findById(cartProduct.product);
      if (!product) {
        // Handle if the product is not found in the product collection
        console.error(`Product with ID ${cartProduct.product} not found.`);
        continue; // Skip to the next product
      }

      if (!product || product.stock < cartProduct.quantity) {
        // Handle if the ordered quantity exceeds the available stock
        // console.error(`Not enough stock for product ${product.pname}.`);
        // continue; // Skip to the next product
        res.redirect("/cart");
      }

      product.stock -= cartProduct.quantity;
      await product.save();
    }

    const deliverydetails = {
      name: address.name,
      mobile: address.mobile,
      city: address.city,
      pincode: address.pincode,
      district: address.district,
      landmark: address.landmark,
      state: address.state,
      address: address.address,
    };

    const newOrder = new Order({
      user: userId,
      userAddress: deliverydetails,
      products: cartItems.products,
      total: cartItems.totalPrice,
      paymentMethod: paymentMethod,
      status: "Pending",
    });
    const order = await newOrder.save();

    // Clear cart after placement (consider using a try-catch block for this)
    await Cart.findOneAndUpdate(
      { user: userId },
      { products: [], totalPrice: 0 }
    );

    // Redirect to order confirmation page
    res.render("confirmation", { order });
  } catch (error) {
    console.log(error.message);
    res.redirect("/checkout");
  }
};

const orderdetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const order = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "products", // Replace 'products' with the name of your 'Product' collection
          localField: "products.product",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);

    res.render("orderdetails", { order });
  } catch (error) {
    console.log(error.message);
  }
};

const orderHistory = async (req, res) => {
  try {
    const id = req.query.id;

    const orders = await Order.find({ _id: id })
      .populate("products.product")
      .exec();
    res.render("order-history", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    // const newStatus = req.body.status
    const orderId = req.params.orderId;
    console.log(orderId);
    const order = await Order.findById(orderId);
    console.log(order);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Increase stock for each product in the canceled order
    for (const orderProduct of order.products) {
      const product = await Product.findById(orderProduct.product);
      if (!product) {
        // Handle if the product is not found in the product collection
        console.error(`Product with ID ${orderProduct.product} not found.`);
        continue; // Skip to the next product
      }

      product.stock += orderProduct.quantity;
      await product.save();
    }
    const updatedOrder = await Order.findByIdAndUpdate(orderId, {
      status: "Cancelled",
    });
    res.json({ success: true, message: "Order successfully canceled!" });
  } catch (error) {
    console.log(error.message);
  }
};

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
  addToCart,
  loadCart,
  updateQuantity,
  deleteProduct,
  forgotpass,
  forgotpassVerify,
  setNewPassword,
  loadCheckout,
  processCheckout,
  orderdetails,
  cancelOrder,
  orderHistory,
};
