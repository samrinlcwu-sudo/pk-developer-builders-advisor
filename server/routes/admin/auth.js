const express = require("express");
const bcrypt = require("bcryptjs");
const adminUserModel = require("../../models/adminUser");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session && req.session.adminUserId) {
    return res.redirect("/admin");
  }
  res.render("admin/login", { error: null });
});

router.post("/login", verifyCsrfToken, (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = adminUserModel.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).render("admin/login", { error: "Invalid email or password." });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).render("admin/login", { error: "Something went wrong. Try again." });
    req.session.adminUserId = user.id;
    req.session.adminEmail = user.email;
    adminUserModel.touchLastLogin(user.id);
    res.redirect("/admin");
  });
});

router.post("/logout", verifyCsrfToken, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
