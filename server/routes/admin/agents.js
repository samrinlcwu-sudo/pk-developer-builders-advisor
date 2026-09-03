const express = require("express");
const agentModel = require("../../models/agent");
const { validateAgentFields } = require("../../middleware/validate");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("agents");

router.get("/", (req, res) => {
  const agents = agentModel.findAllForAdmin();
  res.render("admin/agents/list", { agents });
});

router.get("/new", (req, res) => {
  res.render("admin/agents/form", { agent: null, errors: [] });
});

router.post("/", upload.single("photo"), verifyCsrfToken, (req, res) => {
  const { errors, fields } = validateAgentFields(req.body);

  if (errors.length) {
    return res.status(422).render("admin/agents/form", { agent: fields, errors });
  }

  const photoPath = req.file ? publicPathFor("agents", req.file.filename) : null;
  const isPublished = req.body.isPublished === "on";
  const agent = agentModel.create({ ...fields, photoPath, isPublished });

  res.redirect(`/admin/agents/${agent.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const agent = agentModel.findById(Number(req.params.id));
  if (!agent) return res.status(404).send("Agent not found");
  res.render("admin/agents/form", { agent, errors: [] });
});

router.post("/:id", upload.single("photo"), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = agentModel.findById(id);
  if (!existing) return res.status(404).send("Agent not found");

  const { errors, fields } = validateAgentFields(req.body);
  const isPublished = req.body.isPublished === "on";

  if (errors.length) {
    return res.status(422).render("admin/agents/form", {
      agent: { ...existing, ...fields, is_published: isPublished ? 1 : 0 },
      errors,
    });
  }

  agentModel.update(id, { ...fields, isPublished });
  if (req.file) {
    agentModel.setPhoto(id, publicPathFor("agents", req.file.filename));
  }

  res.redirect(`/admin/agents/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  agentModel.remove(Number(req.params.id));
  res.redirect("/admin/agents");
});

module.exports = router;
