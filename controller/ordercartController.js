const Product = require("../model/product");
const Cart = require("../model/cartModel");
const Address = require("../model/address");
const User = require("../model/model");
const Order = require("../model/ordersM");
const Coupon = require("../model/coupon");
const cartHelper = require("../helper/carthelper");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { ObjectId } = require("mongodb");
const { log } = require("console");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const perPage = 4;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const ordercartController = {
  addToCart: async (req, res) => {
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
              const updatedQuantity = existingProduct.quantity + 1;
              const updatedPrice = existingProduct.price + (product.offerPrice > 0 ? product.offerPrice : product.price);
              await Cart.updateOne(
                { user: userId, "products.product": productId },
                {
                  $inc: {
                    // "products.$.quantity": 1,
                    // "products.$.price": product.price,
                    // totalPrice: product.price,
                    totalPrice: (product.offerPrice > 0 ? product.offerPrice : product.price),

                  },
                  $set: {  "products.$.quantity": updatedQuantity,
                  "products.$.price": updatedPrice, },
                }
              );
              const updatedCart = await Cart.findOne({ user: userId });
              return { status: true, cart: updatedCart };
            } else {
              const productObj = {
                product: productId,
                quantity: 1,
                price:
                  product.offerPrice > 0 ? product.offerPrice : product.price, // Use offerPrice if available, otherwise use regular price
              };
              await Cart.updateOne(
                { user: userId },
                {
                  $push: { products: productObj },
                  $inc: { totalPrice: productObj.price },
                }
              );
            }
          } else {
            const productObj = {
              product: productId,
              quantity: 1,
              price:
                product.offerPrice > 0 ? product.offerPrice : product.price,
            };
            const newCart = await Cart.create({
              user: userId,
              products: [productObj],
              totalPrice: productObj.price,
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
      console.log(error.message);
      res.status(500).json({ error: "An error occurred" });
    }
  },

  loadCart: async (req, res) => {
    try {
      const loggedIn = req.session.loggedIn
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
            offerPrice: "$products.offerPrice",
            carted: { $arrayElemAt: ["$carted", 0] },
            productId: "$carted._id" 
          },
        },
      ]);
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
      // const discountAmount = cart[0].carted.price * cart[0].quantity - cartTotal;

     
      res.render("cart", { cart, userId, count, cartTotal ,loggedIn, cartProductCount });
    } catch (error) {
      console.log(error.message);
      res.send({ success: false, error: error.message });
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const userId = req.session.userId;

      const response = await cartHelper.updateQuantity(req.body);
      
      res.json(response);
    } catch (error) {
      console.log(error.message);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const response = await cartHelper.deleteProduct(req.body);
      res.send(response);
    } catch (error) {
      res
        .status(500)
        .send({ error: "An error occurred while deleting the product." });
    }
  },

  loadCheckout: async (req, res) => {
    try {
      const loggedIn = req.session.loggedIn
      const userId = req.session.userId;
      const user = await User.findById(userId);
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

      const availableCoupons = await Coupon.find({
        active: true,
        start: { $lte: new Date() },
        validity: { $gte: new Date() },
        usedBy: { $not: { $in: [userId] } },
      });

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

      res.render("checkout", {
        user,
        cartItems,
        addresses,
        totalPrice,
        availableCoupons,
        loggedIn,
        cartProductCount
      });
    } catch (error) {
      console.log(error.message);
      res.redirect("/loadcart");
    }
  },

  processCheckout: async (req, res) => {
    try {
      const {
        paymentMethod,
        deliveryAddress,
        currentTotalPrice,
        appliedCouponCode,
      } = req.body;

      const addressId = new mongoose.Types.ObjectId(deliveryAddress);

      const userId = req.session.userId;

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
          console.error(`Product with ID ${cartProduct.product} not found.`);
          continue;
        }

        if (product.stock < cartProduct.quantity) {
          console.log("Product out of stock");
          return res.redirect("/loadcart");
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

      const orderProducts = cartItems.products.map((cartProduct) => {
        return {
          product: cartProduct.product,
          quantity: cartProduct.quantity,
          price: cartProduct.price,
          status: "Pending", // Or set it based on your specific logic
        };
      });

      const user = await User.findById(userId);

      const walletBalance = user.totalBalance;

      if (paymentMethod === "wallet") {
        if (walletBalance >= currentTotalPrice) {
          user.totalBalance -= currentTotalPrice;
          paidWithWallet = currentTotalPrice;

          user.wallet.push({
            amount: paidWithWallet,
            timestamp: Date.now(),
            type: "Debited",
          });

          await user.save();
        } else {
          return res.json({ error: "Not enough wallet balance." });
        }
        await user.save();
      }

      const newOrder = new Order({
        user: userId,
        userAddress: deliverydetails,
        products: orderProducts,
        total: currentTotalPrice,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "Completed" : "Pending",
      });

      const order = await newOrder.save();

      if (appliedCouponCode) {
        const coupon = await Coupon.findOne({ coupon: appliedCouponCode });

        coupon.usedBy.push(userId);

        await coupon.save();
      }

      if (paymentMethod === "razorpay") {
        const createRazorpayOrder = async (cartItems, order) => {
          const razorpayOrder = await razorpayInstance.orders.create({
            amount: currentTotalPrice * 100,
            currency: "INR",
            receipt: order._id.toString(),
          });
          return razorpayOrder;
        };

        const razorpayOrder = await createRazorpayOrder(cartItems, order);

        await Cart.findOneAndUpdate(
          { user: userId },
          { products: [], totalPrice: 0 }
        );

        res.json({ order, razorpayOrder });
      } else if (paymentMethod === "cod" || paymentMethod === "wallet") {
        // Clear cart after successful order placement
        await Cart.findOneAndUpdate(
          { user: userId },
          { products: [], totalPrice: 0 }
        );

        res.json({ order });
      } else {
        res.status(400).json({ error: "Invalid payment method" });
      }
    } catch (error) {
      console.log(error.message);
      res.redirect("/checkout");
    }
  },

   paymentFailed : async (req, res) => {
    try {
      const order = req.body;
  
      
      const orderIdToRemove = order.order.receipt;
  
      
      const removedOrder = await Order.findByIdAndRemove(orderIdToRemove);
  
      if (removedOrder) {
        console.log('Order removed:', removedOrder);
        res.send({ status: true });
      } else {
        console.log('Order not found');
        res.status(404).send({ status: false });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({ status: false });
    }
  },

  orderdetails: async (req, res) => {
    const { session, query } = req;
    const loggedIn = req.session.loggedIn
    const userId = session.userId;
    const page = parseInt(query.page) || 1; // Set the default page to 1
    const perPage = 2; // Adjust this number as needed
  
    try {
      const totalOrders = await Order.countDocuments({ user: userId });
      const totalPages = Math.ceil(totalOrders / perPage);
  
      const orders = await Order.find({ user: userId })
        .populate({
          path: "products.product",
          model: "Product",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

        let cartProductCount = 0
      if (loggedIn) {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
  
        if (cart) {
          cartProductCount = cart.products.length;
        }
        
      }
        console.log(orders);
  
      res.render("orderdetails", {
        orders,
        currentPage: page,
        totalPages,
        loggedIn,
        cartProductCount
      });
    } catch (error) {
      console.log(error.message);
      res.sendStatus(500);
    }
  },
  

  orderHistory: async (req, res) => {
    try {
      const loggedIn = req.session.loggedIn
      const orderId = req.query.id;
      const productIndex = parseInt(req.query.productIndex);
      const order = await Order.findById(orderId)
      .populate("user")
        .populate("products.product")
        .exec();
        if (!order) {
          return res.status(404).render("error", { errorMsg: "Order not found." });
        }
    
        const selectedProduct = order.products[productIndex];
        const orderid = order._id.toString();
        const productId = selectedProduct.product._id.toString()

        let cartProductCount = 0
        if (loggedIn) {
          const userId = req.session.userId;
          const cart = await Cart.findOne({ user: userId });
    
          if (cart) {
            cartProductCount = cart.products.length;
          }
          
        }
        const currentDate = new Date();
        const orderingDate = new Date(order.orderingDate); // Assuming you have an orderingDate property in your order model
    
        // Calculate the number of days elapsed since ordering
        const daysElapsed = Math.floor(
          (currentDate - orderingDate) / (1000 * 60 * 60 * 24)
        );
    
        // Check if it's within 10 days, and only then display the return button
        const canReturn = daysElapsed <= 10;  
        
        res.render("order-history", { orders: order, product: selectedProduct,
                                        productIndex,orderid,productId 
                                      ,loggedIn, cartProductCount,canReturn});
      } catch (error) {
      console.log(error.message);
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const productId = req.params.productId;
  
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }
  
      // Check if the payment method is Razorpay
      if (order.paymentMethod === 'razorpay') {
        const productToCancel = order.products.find(
          (product) => product.product.toString() === productId
        );
  
        if (!productToCancel) {
          return res.status(404).json({ error: "Product not found in the order" });
        }
  
        // Calculate the amount to refund (assuming product price is stored in productToCancel.price)
        const refundAmount = productToCancel.price * productToCancel.quantity;
  
        // Update the user's wallet balance by crediting the refundAmount
        const user = await User.findById(order.user);
  
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }
  
        // Credit the refundAmount to the user's wallet
        const creditTransaction = {
          amount: refundAmount,
          type: 'Credited', // Use 'Credited' to indicate money added to the wallet
        };
  
        // Add the credit transaction to the user's wallet
        user.wallet.push(creditTransaction);
  
        // Calculate the new total balance using the pre-save hook
        await user.save();
      }
  
      // Increase stock for each product in the canceled order
      for (const orderProduct of order.products) {
        const product = await Product.findById(productId);
        if (!product) {
          // Handle if the product is not found in the product collection
          console.error(`Product with ID ${orderProduct.product} not found.`);
          continue; // Skip to the next product
        }
  
        product.stock += orderProduct.quantity;
        await product.save();
      }
  
      const productToCancel = order.products.find(
        (product) => product.product.toString() === productId
      );
      if (!productToCancel) {
        return res.status(404).json({ error: "Product not found in the order" });
      }
      productToCancel.status = "Cancelled";
      await order.save();
  
      res.json({ success: true, message: "Product successfully canceled!" });
    } catch (error) {
      console.log(error.message);
    }
  },
  
  verifyPayment: async (req, res) => {
    try {
      const { payment, order } = req.body;

      const crypto = require("crypto");
      const hmac = crypto
        .createHmac("sha256", "fN9eggfW5bL7fK4Bs1ijUUgj")
        .update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id)
        .digest("hex");

      if (hmac === payment.razorpay_signature) {
        await Order.updateOne(
          { _id: order.receipt },
          { $set: { paymentStatus: "Completed" } },
          { upsert: true }
        );
        const orders = await Order.findById(order.receipt);

        res.json({ status: true, orders });
      } else {
        res.json({ status: false });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  orderSuccessView: async (req, res) => {
    const loggedIn = req.session.loggedIn
    let cartProductCount = 0
    if (loggedIn) {
      const userId = req.session.userId;
      const cart = await Cart.findOne({ user: userId });

      if (cart) {
        cartProductCount = cart.products.length;
      }
      
    }
    res.render("confirmation",{loggedIn,cartProductCount});
  },

  returnProduct: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const productId = req.params.productId;
      const userId = req.session.userId;
      const order = await Order.findById(orderId);

      const orderProduct = order.products.find(
        (p) => p.product.toString() === productId);

      if (!orderProduct) {
        return res
          .status(404)
          .json({ error: "Product not found in the order." });
      }
      

      const product = await Product.findById(productId);

      const totalRefundAmount = product.price * orderProduct.quantity;

      product.stock += orderProduct.quantity;

      await product.save();

      orderProduct.status = "Returned";

      try {
        await order.save();
        console.log("Order saved successfully");
      } catch (saveError) {
        console.error("Error saving order:", saveError);
        throw saveError; // Re-throw the error to be caught in the outer catch block
      }

      const user = await User.findById({ _id: new ObjectId(userId) });
      if (!user.wallet) {
        user.wallet = [];
      }

      user.wallet.push({
        amount: totalRefundAmount,
        timestamp: Date.now(),
        type: "Credited",
      });

      await user.save();

      return res.json({
        success: true,
        message: "Product successfully returned!",
      });
    } catch (error) {
      console.log(error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "An error occurred while processing the return.",
        });
    }
  },
};

module.exports = ordercartController;
