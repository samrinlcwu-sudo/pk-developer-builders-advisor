const express = require("express");
const projectModel = require("../../models/project");
const locationModel = require("../../models/location");
const { validateProjectFields, PROJECT_STATUSES, VERIFIED_FEATURE_CATEGORIES } = require("../../middleware/validate");
const { slugify } = require("../../services/slugify");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("projects");

function formOptions() {
  return {
    statuses: PROJECT_STATUSES,
    verifiedFeatureCategories: VERIFIED_FEATURE_CATEGORIES,
    locations: locationModel.findAllForAdmin(),
  };
}

function canPublish(project) {
  return Boolean(project.title && project.location_id && project.images && project.images.length > 0);
}

router.get("/", (req, res) => {
  const projects = projectModel.findAllForAdmin();
  res.render("admin/projects/list", { projects });
});

router.get("/new", (req, res) => {
  res.render("admin/projects/form", { project: null, errors: [], ...formOptions() });
});

router.post("/", verifyCsrfToken, (req, res) => {
  const { errors, fields } = validateProjectFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && projectModel.slugExists(slug)) {
    errors.push(`Slug "${slug}" is already in use. Choose a different title or slug.`);
  }

  if (errors.length) {
    return res.status(422).render("admin/projects/form", { project: { ...fields, slug }, errors, ...formOptions() });
  }

  // New projects always start unpublished — publishing requires at least
  // one image, which can only be uploaded after the project row exists.
  const project = projectModel.create({ ...fields, slug, isPublished: false });
  const featureLabels = String(req.body.featuresText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  projectModel.replaceFeatures(project.id, featureLabels);

  res.redirect(`/admin/projects/${project.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const project = projectModel.findById(Number(req.params.id));
  if (!project) return res.status(404).send("Project not found");
  res.render("admin/projects/form", { project, errors: [], ...formOptions() });
});

router.post("/:id", verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = projectModel.findById(id);
  if (!existing) return res.status(404).send("Project not found");

  const { errors, fields } = validateProjectFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && projectModel.slugExists(slug, id)) {
    errors.push(`Slug "${slug}" is already in use by another project.`);
  }
  if (slug && existing.slug !== slug) {
    errors.push(
      `Changing the slug from "${existing.slug}" to "${slug}" will break any existing links to this project. The slug has NOT been changed.`
    );
    slug = existing.slug;
  }

  const wantsPublish = req.body.isPublished === "on";
  const candidateForGate = { ...existing, ...fields, images: existing.images };
  if (wantsPublish && !canPublish(candidateForGate)) {
    errors.push("Cannot publish: a project needs a title, location, and at least one image first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/projects/form", {
      project: { ...existing, ...fields, slug, is_published: wantsPublish ? 1 : 0 },
      errors,
      ...formOptions(),
    });
  }

  projectModel.update(id, { ...fields, slug, isPublished: wantsPublish });
  const featureLabels = String(req.body.featuresText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  projectModel.replaceFeatures(id, featureLabels);

  const verifiedValues = {};
  VERIFIED_FEATURE_CATEGORIES.forEach((category) => {
    verifiedValues[category] = req.body[`verified_${category}`] || "";
  });
  projectModel.replaceVerifiedFeatures(id, verifiedValues);

  res.redirect(`/admin/projects/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  projectModel.remove(Number(req.params.id));
  res.redirect("/admin/projects");
});

router.post("/:id/images", upload.array("images", 10), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const project = projectModel.findById(id);
  if (!project) return res.status(404).send("Project not found");

  const files = req.files || [];
  files.forEach((file, index) => {
    projectModel.addImage(id, {
      filePath: publicPathFor("projects", file.filename),
      isPrimary: project.images.length === 0 && index === 0,
      sortOrder: project.images.length + index,
    });
  });

  res.redirect(`/admin/projects/${id}/edit`);
});

router.post("/:id/images/:imageId/delete", verifyCsrfToken, (req, res) => {
  projectModel.removeImage(Number(req.params.imageId));
  res.redirect(`/admin/projects/${req.params.id}/edit`);
});

module.exports = router;
