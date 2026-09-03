const express = require("express");
const siteSettingsModel = require("../../models/siteSettings");
const { sanitizeText } = require("../../middleware/validate");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
router.use(verifyCsrfToken);

const STAT_KEYS = ["stat_years", "stat_projects", "stat_clients", "stat_cities"];
const TEXT_KEYS = ["whatsapp_number"];

router.get("/", (req, res) => {
  res.render("admin/site-settings/form", { settings: siteSettingsModel.getAll(), saved: req.query.saved === "1" });
});

router.post("/", (req, res) => {
  [...STAT_KEYS, ...TEXT_KEYS].forEach((key) => {
    siteSettingsModel.set(key, sanitizeText(req.body[key], 200));
  });
  res.redirect("/admin/site-settings?saved=1");
});

module.exports = router;
