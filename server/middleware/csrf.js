const crypto = require("node:crypto");

// Synchronizer-token CSRF protection for the admin panel. A token is
// generated once per session and exposed to every admin view via
// res.locals.csrfToken (see views/admin/partials/head.ejs's meta tag);
// js/admin.js reads that meta tag and injects the token into every
// same-page <form method="post">. verifyCsrfToken must run AFTER any
// multer middleware on multipart routes, since req.body isn't populated
// until multer parses the body — see each admin/*.js route file for
// where it's placed.
function attachCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function verifyCsrfToken(req, res, next) {
  if (req.method !== "POST") return next();
  const provided = req.body && req.body._csrf;
  if (!provided || provided !== req.session.csrfToken) {
    return res.status(403).send("Your session has expired or this form was submitted from an untrusted source. Please refresh the page and try again.");
  }
  next();
}

module.exports = { attachCsrfToken, verifyCsrfToken };
