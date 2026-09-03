const express = require("express");
const propertyModel = require("../../models/property");
const projectModel = require("../../models/project");
const articleModel = require("../../models/article");
const env = require("../../config/env");

const router = express.Router();

const STATIC_PAGES = [
  "/",
  "/about.html",
  "/services.html",
  "/development.html",
  "/construction.html",
  "/advisory.html",
  "/contact.html",
  "/properties",
  "/projects",
  "/insights",
];

router.get("/sitemap.xml", (req, res) => {
  const properties = propertyModel.findAll({ publishedOnly: true, pageSize: 1000 }).data;
  const projects = projectModel.findAll({ publishedOnly: true, pageSize: 1000 }).data;
  const articles = articleModel.findAll({ publishedOnly: true, pageSize: 1000 }).data;

  const paths = [
    ...STATIC_PAGES,
    ...properties.map((p) => `/properties/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...articles.map((a) => `/insights/${a.slug}`),
  ];

  const urls = paths.map((p) => `  <url><loc>${env.publicSiteOrigin}${p}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  res.type("application/xml").send(xml);
});

module.exports = router;
