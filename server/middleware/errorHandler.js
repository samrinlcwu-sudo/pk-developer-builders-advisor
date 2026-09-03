function notFoundHandler(req, res) {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
  }
  res.status(404).send("Page not found");
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  console.error("[error]", req.method, req.originalUrl, "-", err.message);

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(status).json({
      error: { message: status === 500 ? "Internal server error" : err.message, code: err.code || "ERROR" },
    });
  }
  res.status(status).send(status === 500 ? "Internal server error" : err.message);
}

module.exports = { notFoundHandler, errorHandler };
