const express = require("express");
const propertyModel = require("../../models/property");
const locationModel = require("../../models/location");
const agentModel = require("../../models/agent");
const { validatePropertyFields, PROPERTY_TYPES, PROPERTY_STATUSES } = require("../../middleware/validate");
const { slugify } = require("../../services/slugify");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("properties");

function formOptions() {
  return {
    types: PROPERTY_TYPES,
    statuses: PROPERTY_STATUSES,
    locations: locationModel.findAllForAdmin(),
    agents: agentModel.findAllForAdmin(),
  };
}

function canPublish(property) {
  return Boolean(property.title && property.type && property.location_id && property.images && property.images.length > 0);
}

router.get("/", (req, res) => {
  const properties = propertyModel.findAllForAdmin();
  res.render("admin/properties/list", { properties });
});

router.get("/new", (req, res) => {
  res.render("admin/properties/form", { property: null, errors: [], ...formOptions() });
});

router.post("/", verifyCsrfToken, (req, res) => {
  const { errors, fields } = validatePropertyFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && propertyModel.slugExists(slug)) {
    errors.push(`Slug "${slug}" is already in use. Choose a different title or slug.`);
  }

  if (errors.length) {
    return res.status(422).render("admin/properties/form", { property: { ...fields, slug }, errors, ...formOptions() });
  }

  // New properties always start unpublished — publishing requires at least
  // one image, which can only be uploaded after the property row exists.
  const property = propertyModel.create({ ...fields, slug, isPublished: false });
  const featureLabels = String(req.body.featuresText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  propertyModel.replaceFeatures(property.id, featureLabels);

  res.redirect(`/admin/properties/${property.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const property = propertyModel.findById(Number(req.params.id));
  if (!property) return res.status(404).send("Property not found");
  res.render("admin/properties/form", { property, errors: [], ...formOptions() });
});

router.post("/:id", verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = propertyModel.findById(id);
  if (!existing) return res.status(404).send("Property not found");

  const { errors, fields } = validatePropertyFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && propertyModel.slugExists(slug, id)) {
    errors.push(`Slug "${slug}" is already in use by another property.`);
  }
  if (slug && existing.slug !== slug) {
    errors.push(
      `Changing the slug from "${existing.slug}" to "${slug}" will break any existing links to this property. Remove this warning by re-submitting only if you're sure — for now, the slug has NOT been changed.`
    );
    slug = existing.slug;
  }

  const wantsPublish = req.body.isPublished === "on";
  const candidateForGate = { ...existing, ...fields, images: existing.images };
  if (wantsPublish && !canPublish(candidateForGate)) {
    errors.push("Cannot publish: a property needs a title, type, location, and at least one image first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/properties/form", {
      property: { ...existing, ...fields, slug, isPublished: wantsPublish ? 1 : 0 },
      errors,
      ...formOptions(),
    });
  }

  propertyModel.update(id, { ...fields, slug, isPublished: wantsPublish });
  const featureLabels = String(req.body.featuresText || "").split("\n").map((l) => l.trim()).filter(Boolean);
  propertyModel.replaceFeatures(id, featureLabels);

  res.redirect(`/admin/properties/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  propertyModel.remove(Number(req.params.id));
  res.redirect("/admin/properties");
});

router.post("/:id/images", upload.array("images", 10), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const property = propertyModel.findById(id);
  if (!property) return res.status(404).send("Property not found");

  const files = req.files || [];
  files.forEach((file, index) => {
    propertyModel.addImage(id, {
      filePath: publicPathFor("properties", file.filename),
      isPrimary: property.images.length === 0 && index === 0,
      sortOrder: property.images.length + index,
    });
  });

  res.redirect(`/admin/properties/${id}/edit`);
});

router.post("/:id/images/:imageId/delete", verifyCsrfToken, (req, res) => {
  propertyModel.removeImage(Number(req.params.imageId));
  res.redirect(`/admin/properties/${req.params.id}/edit`);
});

module.exports = router;
