const nodemailer = require("nodemailer");
const env = require("../config/env");
const enquiryModel = require("../models/enquiry");

let transporter = null;
function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

const ENQUIRY_TYPE_LABELS = {
  consultation: "Consultation request",
  "property-info": "Property information request",
  "project-info": "Project information request",
  viewing: "Viewing request",
  advisory: "Advisory request",
  contact: "Contact form submission",
  "whatsapp-click": "WhatsApp click",
};

// Fire-and-forget: always resolves, never throws. The enquiry is already
// persisted by the time this runs — a notification failure (or SMTP not
// being configured at all) must never make the lead capture look like it
// failed to the visitor.
async function notifyNewEnquiry(enquiry) {
  const transport = getTransporter();
  if (!transport) {
    enquiryModel.markNotified(enquiry.id, "SMTP not configured — see .env (SMTP_HOST)");
    return;
  }
  if (!env.notifyToEmail) {
    enquiryModel.markNotified(enquiry.id, "NOTIFY_TO_EMAIL not configured — see .env");
    return;
  }

  const label = ENQUIRY_TYPE_LABELS[enquiry.type] || enquiry.type;
  const lines = [
    `Type: ${label}`,
    enquiry.name ? `Name: ${enquiry.name}` : null,
    enquiry.phone ? `Phone: ${enquiry.phone}` : null,
    enquiry.email ? `Email: ${enquiry.email}` : null,
    enquiry.interest ? `Interest: ${enquiry.interest}` : null,
    enquiry.message ? `Message:\n${enquiry.message}` : null,
    "",
    `View in admin: ${env.publicSiteOrigin}/admin/enquiries`,
  ].filter(Boolean);

  try {
    await transport.sendMail({
      from: env.smtp.from || env.smtp.user,
      to: env.notifyToEmail,
      subject: `New enquiry — ${label}`,
      text: lines.join("\n"),
    });
    enquiryModel.markNotified(enquiry.id, null);
  } catch (err) {
    console.error("[notify] Failed to send enquiry notification:", err.message);
    enquiryModel.markNotified(enquiry.id, err.message);
  }
}

module.exports = { notifyNewEnquiry };
