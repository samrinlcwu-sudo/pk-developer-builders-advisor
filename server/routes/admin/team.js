const express = require("express");
const teamMemberModel = require("../../models/teamMember");
const { validateTeamMemberFields } = require("../../middleware/validate");
const { makeUploader, publicPathFor } = require("../../middleware/upload");
const { verifyCsrfToken } = require("../../middleware/csrf");

const router = express.Router();
const upload = makeUploader("team");

router.get("/", (req, res) => {
  const members = teamMemberModel.findAllForAdmin();
  res.render("admin/team/list", { members });
});

router.get("/new", (req, res) => {
  res.render("admin/team/form", { member: null, errors: [] });
});

router.post("/", upload.single("photo"), verifyCsrfToken, (req, res) => {
  const { errors, fields } = validateTeamMemberFields(req.body);

  if (errors.length) {
    return res.status(422).render("admin/team/form", { member: fields, errors });
  }

  const photoPath = req.file ? publicPathFor("team", req.file.filename) : null;
  const isPublished = req.body.isPublished === "on";
  const member = teamMemberModel.create({ ...fields, photoPath, isPublished });

  res.redirect(`/admin/team/${member.id}/edit`);
});

router.get("/:id/edit", (req, res) => {
  const member = teamMemberModel.findById(Number(req.params.id));
  if (!member) return res.status(404).send("Team member not found");
  res.render("admin/team/form", { member, errors: [] });
});

router.post("/:id", upload.single("photo"), verifyCsrfToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = teamMemberModel.findById(id);
  if (!existing) return res.status(404).send("Team member not found");

  const { errors, fields } = validateTeamMemberFields(req.body);
  const isPublished = req.body.isPublished === "on";

  if (errors.length) {
    return res.status(422).render("admin/team/form", {
      member: { ...existing, ...fields, is_published: isPublished ? 1 : 0 },
      errors,
    });
  }

  teamMemberModel.update(id, { ...fields, isPublished });
  if (req.file) {
    teamMemberModel.setPhoto(id, publicPathFor("team", req.file.filename));
  }

  res.redirect(`/admin/team/${id}/edit`);
});

router.post("/:id/delete", verifyCsrfToken, (req, res) => {
  teamMemberModel.remove(Number(req.params.id));
  res.redirect("/admin/team");
});

module.exports = router;
