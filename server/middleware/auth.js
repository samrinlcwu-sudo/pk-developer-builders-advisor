function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUserId) {
    res.locals.adminEmail = req.session.adminEmail;
    return next();
  }
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(401).json({ error: { message: "Authentication required", code: "UNAUTHENTICATED" } });
  }
  return res.redirect("/admin/login");
}

module.exports = { requireAdmin };
