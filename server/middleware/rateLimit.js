const rateLimit = require("express-rate-limit");

// Shared across all public write endpoints (contact/property/project
// enquiries) so one visitor can't just spread the same volume of
// submissions across the three forms to dodge the limit.
const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" } },
});

// Brute-force protection on the admin login form. Deliberately more
// generous than the public-write limiter (a real admin mistyping their
// password a few times shouldn't get locked out), but still bounded.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" } },
});

module.exports = { publicWriteLimiter, adminLoginLimiter };
