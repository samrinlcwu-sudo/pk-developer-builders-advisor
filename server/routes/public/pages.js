const express = require("express");
const projectModel = require("../../models/project");
const testimonialModel = require("../../models/testimonial");
const teamMemberModel = require("../../models/teamMember");
const siteSettingsModel = require("../../models/siteSettings");

const router = express.Router();

router.get(["/", "/index.html"], (req, res) => {
  res.render("public/index", {
    featuredProjects: projectModel.findFeaturedPublished(3),
    testimonials: testimonialModel.findAllPublished(3),
    settings: siteSettingsModel.getAll(),
  });
});

router.get("/about.html", (req, res) => {
  res.render("public/about", {
    teamMembers: teamMemberModel.findAllPublished(),
  });
});

module.exports = router;
