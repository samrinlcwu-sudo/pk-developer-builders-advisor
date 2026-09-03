const express = require("express");
const testimonialModel = require("../../models/testimonial");
const { validateTestimonialFields } = require("../../middleware/validate");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
router.use(verifyCsrfToken);

router.get("/", (req, res) => {
  const testimonials = testimonialModel.findAllForAdmin();
  res.render("admin/testimonials/list", { testimonials });
});

router.get("/new", (req, res) => {
  res.render("admin/testimonials/form", { testimonial: null, errors: [] });
});

router.post("/", (req, res) => {
  const { errors, fields } = validateTestimonialFields(req.body);
  const isVerified = req.body.isVerified === "on";
  const wantsPublish = req.body.isPublished === "on";

  if (wantsPublish && !isVerified) {
    errors.push("Cannot publish: a testimonial must be marked verified first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/testimonials/form", {
      testimonial: { ...fields, is_verified: isVerified ? 1 : 0, is_published: wantsPublish ? 1 : 0 },
      errors,
    });
  }

  const testimonial = testimonialModel.create({ ...fields, isVerified, isPublished: wantsPublish });
  res.redirect(`/admin/testimonials/${testimonial.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const testimonial = testimonialModel.findById(Number(req.params.id));
  if (!testimonial) return res.status(404).send("Testimonial not found");
  res.render("admin/testimonials/form", { testimonial, errors: [] });
});

router.post("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = testimonialModel.findById(id);
  if (!existing) return res.status(404).send("Testimonial not found");

  const { errors, fields } = validateTestimonialFields(req.body);
  const isVerified = req.body.isVerified === "on";
  const wantsPublish = req.body.isPublished === "on";

  if (wantsPublish && !isVerified) {
    errors.push("Cannot publish: a testimonial must be marked verified first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/testimonials/form", {
      testimonial: { ...existing, ...fields, is_verified: isVerified ? 1 : 0, is_published: wantsPublish ? 1 : 0 },
      errors,
    });
  }

  testimonialModel.update(id, { ...fields, isVerified, isPublished: wantsPublish });
  res.redirect(`/admin/testimonials/${id}/edit`);
});

router.post("/:id/delete", (req, res) => {
  testimonialModel.remove(Number(req.params.id));
  res.redirect("/admin/testimonials");
});

module.exports = router;
