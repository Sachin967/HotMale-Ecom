const adminWare = {
  adminLoginCheck: (req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    if (!req.session.loggedIn) res.redirect("/adminlogin");
    else if (!req.session.admin) res.redirect("/adminlogin");
    else next();
  },

  forLogin: (req, res, next) => {
    if (req.session.loggedIn && req.session.admin) res.redirect("/dashboard");
    else next();
  },
};

module.exports = adminWare;
