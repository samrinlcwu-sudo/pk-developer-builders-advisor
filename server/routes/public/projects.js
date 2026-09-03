const express = require("express");
const projectModel = require("../../models/project");
const locationModel = require("../../models/location");
const { PROJECT_STATUSES } = require("../../middleware/validate");

const router = express.Router();

router.get("/projects", (req, res) => {
  const q = req.query;
  const result = projectModel.findAll({
    publishedOnly: true,
    status: q.status || undefined,
    location: q.location || undefined,
    page: q.page,
  });

  res.render("public/projects", {
    projects: result.data,
    pagination: result.pagination,
    query: q,
    statuses: PROJECT_STATUSES,
    locations: locationModel.findAllPublished(),
  });
});

router.get("/projects/:slug", (req, res) => {
  const project = projectModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!project) return res.status(404).render("public/not-found", { item: "project" });
  res.render("public/project-detail", { project });
});

module.exports = router;
