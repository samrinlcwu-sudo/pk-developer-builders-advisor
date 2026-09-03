const express = require("express");
const propertyModel = require("../../models/property");
const locationModel = require("../../models/location");
const { toNullableNumber, toNullableInt, PROPERTY_TYPES, PROPERTY_STATUSES } = require("../../middleware/validate");

const router = express.Router();

router.get("/properties", (req, res) => {
  const q = req.query;
  const filters = {
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
    sort: q.sort,
  };
  const result = propertyModel.findAll(filters);

  res.render("public/properties", {
    properties: result.data,
    pagination: result.pagination,
    query: q,
    types: PROPERTY_TYPES,
    statuses: PROPERTY_STATUSES,
    locations: locationModel.findAllPublished(),
  });
});

router.get("/properties/:slug", (req, res) => {
  const property = propertyModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!property) return res.status(404).render("public/not-found", { item: "property" });
  res.render("public/property-detail", { property });
});

module.exports = router;
