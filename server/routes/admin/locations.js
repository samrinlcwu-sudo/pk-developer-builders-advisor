const express = require("express");
const locationModel = require("../../models/location");
const { validateLocationFields } = require("../../middleware/validate");
const { slugify } = require("../../services/slugify");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("locations");

router.get("/", (req, res) => {
  const locations = locationModel.findAllForAdmin();
  res.render("admin/locations/list", { locations });
});

router.get("/new", (req, res) => {
  res.render("admin/locations/form", { location: null, errors: [] });
});

router.post("/", upload.single("image"), verifyCsrfToken, (req, res) => {
  const { errors, fields } = validateLocationFields(req.body);

  const slug = slugify(req.body.slug || fields.name);
  if (!slug) errors.push("A valid slug could not be generated — check the name.");
  if (slug && locationModel.slugExists(slug)) {
    errors.push(`Slug "${slug}" is already in use. Choose a different name or slug.`);
  }

  if (errors.length) {
    return res.status(422).render("admin/locations/form", { location: { ...fields, slug }, errors });
  }

  const imagePath = req.file ? publicPathFor("locations", req.file.filename) : null;
  const isPublished = req.body.isPublished === "on";
  const location = locationModel.create({ ...fields, slug, imagePath, isPublished });

  res.redirect(`/admin/locations/${location.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const location = locationModel.findById(Number(req.params.id));
  if (!location) return res.status(404).send("Location not found");
  res.render("admin/locations/form", { location, errors: [] });
});

router.post("/:id", upload.single("image"), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = locationModel.findById(id);
  if (!existing) return res.status(404).send("Location not found");

  const { errors, fields } = validateLocationFields(req.body);

  let slug = slugify(req.body.slug || fields.name);
  if (!slug) errors.push("A valid slug could not be generated — check the name.");
  if (slug && locationModel.slugExists(slug, id)) {
    errors.push(`Slug "${slug}" is already in use by another location.`);
  }
  if (slug && existing.slug !== slug) {
    errors.push(
      `Changing the slug from "${existing.slug}" to "${slug}" will break any existing links. The slug has NOT been changed.`
    );
    slug = existing.slug;
  }

  const isPublished = req.body.isPublished === "on";

  if (errors.length) {
    return res.status(422).render("admin/locations/form", {
      location: { ...existing, ...fields, slug, is_published: isPublished ? 1 : 0 },
      errors,
    });
  }

  locationModel.update(id, { ...fields, slug, isPublished });
  if (req.file) {
    locationModel.setImage(id, publicPathFor("locations", req.file.filename));
  }

  res.redirect(`/admin/locations/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  locationModel.remove(Number(req.params.id));
  res.redirect("/admin/locations");
});

module.exports = router;
