const express = require("express");
const articleModel = require("../../models/article");
const { ARTICLE_CATEGORIES } = require("../../middleware/validate");

const router = express.Router();

router.get("/insights", (req, res) => {
  const q = req.query;
  const result = articleModel.findAll({
    publishedOnly: true,
    category: q.category || undefined,
    page: q.page,
  });

  res.render("public/insights", {
    articles: result.data,
    pagination: result.pagination,
    query: q,
    categories: ARTICLE_CATEGORIES,
    featured: !q.category ? articleModel.findFeaturedPublished() : null,
  });
});

router.get("/insights/:slug", (req, res) => {
  const article = articleModel.findBySlug(req.params.slug, { publishedOnly: true });
  if (!article) return res.status(404).render("public/not-found", { item: "article" });
  res.render("public/insights-article", {
    article,
    related: articleModel.findRelatedPublished(article.id, 3),
  });
});

module.exports = router;
