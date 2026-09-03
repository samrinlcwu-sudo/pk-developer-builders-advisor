const express = require("express");
const propertyModel = require("../../../models/property");
const { toNullableNumber, toNullableInt } = require("../../../middleware/validate");

const router = express.Router();

router.get("/", (req, res) => {
  const q = req.query;
  const result = propertyModel.findAll({
    publishedOnly: true,
    type: q.type || undefined,
    status: q.status || undefined,
    location: q.location || undefined,
    minPrice: toNullableNumber(q.minPrice),
    maxPrice: toNullableNumber(q.maxPrice),
    minArea: toNullableNumber(q.minArea),
    maxArea: toNullableNumber(q.maxArea),
    bedrooms: toNullableInt(q.bedrooms),
    bathrooms: toNullableInt(q.bathrooms),
    page: q.page,
    pageSize: q.pageSize,
    sort: q.sort,
  });
  res.json(result);
});

router.get("/:slug", (req, res) => {
  const property = propertyModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!property) {
    return res.status(404).json({ error: { message: "Property not found", code: "NOT_FOUND" } });
  }
  res.json({ data: property });
});

module.exports = router;
