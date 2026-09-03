const express = require("express");
const enquiryModel = require("../../models/enquiry");
const { ENQUIRY_TYPES, ENQUIRY_STATUSES } = require("../../middleware/validate");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
router.use(verifyCsrfToken);

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get("/", (req, res) => {
  const filters = { type: req.query.type || undefined, status: req.query.status || undefined };
  const enquiries = enquiryModel.findAllForAdmin(filters);
  const exportParams = new URLSearchParams();
  if (filters.type) exportParams.set("type", filters.type);
  if (filters.status) exportParams.set("status", filters.status);
  const exportUrl = `/admin/enquiries/export.csv${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;
  res.render("admin/enquiries/list", { enquiries, filters, types: ENQUIRY_TYPES, statuses: ENQUIRY_STATUSES, exportUrl });
});

router.get("/export.csv", (req, res) => {
  const filters = { type: req.query.type || undefined, status: req.query.status || undefined };
  const enquiries = enquiryModel.findAllForAdmin(filters);

  const header = ["Date", "Type", "Name", "Phone", "Email", "Interest", "Message", "Status", "Notified"];
  const rows = enquiries.map((e) => [
    e.created_at,
    e.type,
    e.name,
    e.phone,
    e.email,
    e.interest,
    e.message,
    e.status,
    e.notified_at ? (e.notify_error ? `failed: ${e.notify_error}` : "sent") : "pending",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="enquiries-${Date.now()}.csv"`);
  res.send(csv);
});

router.post("/:id/status", (req, res) => {
  const status = ENQUIRY_STATUSES.includes(req.body.status) ? req.body.status : "new";
  enquiryModel.setStatus(Number(req.params.id), status);
  res.redirect("/admin/enquiries");
});

module.exports = router;
