const express = require("express");
const enquiryModel = require("../../models/enquiry");
const propertyModel = require("../../models/property");
const projectModel = require("../../models/project");
const { validateEnquiryFields } = require("../../middleware/validate");
const { isHoneypotTripped } = require("../../middleware/honeypot");
const { publicWriteLimiter } = require("../../middleware/rateLimit");
const { notifyNewEnquiry } = require("../../services/notify");

const router = express.Router();

function handleSubmission(req, res, { type, propertyId, projectId }) {
  if (isHoneypotTripped(req.body)) {
    // Pretend success — never reveal to a bot that it was caught.
    return res.json({ ok: true });
  }

  const { errors, fields } = validateEnquiryFields(req.body);
  if (errors.length) {
    return res.status(422).json({ error: { message: errors.join(" "), code: "VALIDATION" } });
  }

  const enquiry = enquiryModel.create({
    type,
    ...fields,
    propertyId,
    projectId,
    sourcePage: req.get("referer") || null,
  });

  notifyNewEnquiry(enquiry).catch(() => {});

  res.json({ ok: true });
}

router.post("/enquiries", publicWriteLimiter, (req, res) => {
  handleSubmission(req, res, { type: "contact" });
});

// Pure click-tracking, fired via navigator.sendBeacon from the floating
// WhatsApp button — no personal info collected, so it skips the
// name/phone/email validation a real enquiry requires, and it doesn't
// trigger an email notification (it's an analytics event, not a lead).
router.post("/whatsapp-click", publicWriteLimiter, (req, res) => {
  enquiryModel.create({ type: "whatsapp-click", sourcePage: req.get("referer") || null });
  res.status(204).end();
});

router.post("/properties/:slug/enquire", publicWriteLimiter, (req, res) => {
  const property = propertyModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!property) {
    return res.status(404).json({ error: { message: "Property not found", code: "NOT_FOUND" } });
  }
  handleSubmission(req, res, { type: "property-info", propertyId: property.id });
});

router.post("/projects/:slug/enquire", publicWriteLimiter, (req, res) => {
  const project = projectModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!project) {
    return res.status(404).json({ error: { message: "Project not found", code: "NOT_FOUND" } });
  }
  handleSubmission(req, res, { type: "project-info", projectId: project.id });
});

module.exports = router;
