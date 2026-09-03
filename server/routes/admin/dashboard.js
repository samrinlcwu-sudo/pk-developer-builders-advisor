const express = require("express");
const { getDb } = require("../../db/connection");
const enquiryModel = require("../../models/enquiry");

const router = express.Router();

router.get("/", (req, res) => {
  const db = getDb();
  const propertyCount = db.prepare("SELECT COUNT(*) AS n FROM properties").get().n;
  const publishedPropertyCount = db.prepare("SELECT COUNT(*) AS n FROM properties WHERE is_published = 1").get().n;
  const projectCount = db.prepare("SELECT COUNT(*) AS n FROM projects").get().n;
  const publishedProjectCount = db.prepare("SELECT COUNT(*) AS n FROM projects WHERE is_published = 1").get().n;
  const locationCount = db.prepare("SELECT COUNT(*) AS n FROM locations").get().n;
  const agentCount = db.prepare("SELECT COUNT(*) AS n FROM agents").get().n;
  const teamCount = db.prepare("SELECT COUNT(*) AS n FROM team_members").get().n;
  const testimonialCount = db.prepare("SELECT COUNT(*) AS n FROM testimonials").get().n;
  const articleCount = db.prepare("SELECT COUNT(*) AS n FROM articles").get().n;
  const publishedArticleCount = db.prepare("SELECT COUNT(*) AS n FROM articles WHERE is_published = 1").get().n;
  const enquiryCount = enquiryModel.countAll();
  const newEnquiryCount = enquiryModel.countByStatus("new");

  res.render("admin/dashboard", {
    adminEmail: req.session.adminEmail,
    stats: {
      propertyCount,
      publishedPropertyCount,
      projectCount,
      publishedProjectCount,
      locationCount,
      agentCount,
      teamCount,
      testimonialCount,
      articleCount,
      publishedArticleCount,
      enquiryCount,
      newEnquiryCount,
    },
  });
});

module.exports = router;
