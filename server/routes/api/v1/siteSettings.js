const express = require("express");
const siteSettingsModel = require("../../../models/siteSettings");

const router = express.Router();

// Only ever exposes the handful of settings that are safe to hand to
// public, unauthenticated page JS — never the full site_settings table.
router.get("/public", (req, res) => {
  const settings = siteSettingsModel.getAll();
  res.json({ data: { whatsappNumber: settings.whatsapp_number || null } });
});

module.exports = router;
