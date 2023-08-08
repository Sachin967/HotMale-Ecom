const User = require("../model/model");
const Cart = require("../model/cartModel");

const userWare = {
  forLogin: (req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    if (req.session.loggedIn) res.redirect("/");
    else next();
  },

  reEstablish: (req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    next();
  },

  restrict: async (req, res, next) => {
    // req.session.previousUrl = '/'
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    if (req.session.loggedIn) {
      let userData = await User.findOne({ email: req.session.userEmail });

      if (userData && userData.isBlocked === true) {
        res.redirect("/logout");
      } else {
        next();
      }
    } else res.redirect("/login");
  },

  cartNotEmptyMiddleware: async (req, res, next) => {
    try {
      const loggedIn = req.session.loggedIn;

      if (loggedIn) {
        const userId = req.session.userId;

        const cart = await Cart.findOne({ user: userId });

        if (!cart || cart.products.length === 0) {
          return res.redirect("/loadcart");
        }
      }
      next();
    } catch (error) {
      console.log(error.message);
      next(error); // Pass the error to the error handling middleware
    }
  },
};

module.exports = userWare;
