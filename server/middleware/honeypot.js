// A hidden field (styled off-screen via CSS, not display:none, so
// screen-reader-blind bots that fill every field still trip it) present
// on every public form. Any non-empty value means it wasn't filled by a
// human — the request is silently accepted without persisting or
// notifying, so the sender/bot never learns it was rejected.
const HONEYPOT_FIELD = "website";

function isHoneypotTripped(body) {
  return Boolean(body && body[HONEYPOT_FIELD] && String(body[HONEYPOT_FIELD]).trim());
}

module.exports = { HONEYPOT_FIELD, isHoneypotTripped };
