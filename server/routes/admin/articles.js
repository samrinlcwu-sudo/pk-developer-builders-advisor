const express = require("express");
const articleModel = require("../../models/article");
const { validateArticleFields, ARTICLE_CATEGORIES } = require("../../middleware/validate");
const { slugify } = require("../../services/slugify");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("articles");

function formOptions() {
  return { categories: ARTICLE_CATEGORIES };
}

function canPublish(article) {
  return Boolean(article.title && article.category && article.body && article.cover_image_path);
}

router.get("/", (req, res) => {
  const articles = articleModel.findAllForAdmin();
  res.render("admin/articles/list", { articles });
});

router.get("/new", (req, res) => {
  res.render("admin/articles/form", { article: null, errors: [], ...formOptions() });
});

router.post("/", upload.single("coverImage"), verifyCsrfToken, (req, res) => {
  const { errors, fields } = validateArticleFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && articleModel.slugExists(slug)) {
    errors.push(`Slug "${slug}" is already in use. Choose a different title or slug.`);
  }

  const isFeatured = req.body.isFeatured === "on";
  const wantsPublish = req.body.isPublished === "on";
  const coverImagePath = req.file ? publicPathFor("articles", req.file.filename) : null;

  if (wantsPublish && !canPublish({ ...fields, cover_image_path: coverImagePath })) {
    errors.push("Cannot publish: an article needs a title, category, body text, and a cover photo first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/articles/form", {
      article: { ...fields, slug, is_featured: isFeatured ? 1 : 0, is_published: wantsPublish ? 1 : 0 },
      errors,
      ...formOptions(),
    });
  }

  const article = articleModel.create({
    ...fields,
    slug,
    coverImagePath,
    isFeatured,
    isPublished: wantsPublish,
  });

  res.redirect(`/admin/articles/${article.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const article = articleModel.findById(Number(req.params.id));
  if (!article) return res.status(404).send("Article not found");
  res.render("admin/articles/form", { article, errors: [], ...formOptions() });
});

router.post("/:id", upload.single("coverImage"), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = articleModel.findById(id);
  if (!existing) return res.status(404).send("Article not found");

  const { errors, fields } = validateArticleFields(req.body);

  let slug = slugify(req.body.slug || fields.title);
  if (!slug) errors.push("A valid slug could not be generated — check the title.");
  if (slug && articleModel.slugExists(slug, id)) {
    errors.push(`Slug "${slug}" is already in use by another article.`);
  }
  if (slug && existing.slug !== slug) {
    errors.push(
      `Changing the slug from "${existing.slug}" to "${slug}" will break any existing links to this article. The slug has NOT been changed.`
    );
    slug = existing.slug;
  }

  const isFeatured = req.body.isFeatured === "on";
  const wantsPublish = req.body.isPublished === "on";
  const coverImagePath = req.file ? publicPathFor("articles", req.file.filename) : existing.cover_image_path;

  if (wantsPublish && !canPublish({ ...fields, cover_image_path: coverImagePath })) {
    errors.push("Cannot publish: an article needs a title, category, body text, and a cover photo first.");
  }

  if (errors.length) {
    return res.status(422).render("admin/articles/form", {
      article: { ...existing, ...fields, slug, is_featured: isFeatured ? 1 : 0, is_published: wantsPublish ? 1 : 0 },
      errors,
      ...formOptions(),
    });
  }

  articleModel.update(id, { ...fields, slug, isFeatured, isPublished: wantsPublish });
  if (req.file) {
    articleModel.setCoverImage(id, coverImagePath);
  }

  res.redirect(`/admin/articles/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  articleModel.remove(Number(req.params.id));
  res.redirect("/admin/articles");
});

module.exports = router;
