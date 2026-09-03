const env = require("./config/env");
const { runMigrations } = require("./db/migrate");
const { createApp } = require("./app");

runMigrations();

const app = createApp();

app.listen(env.port, () => {
  console.log(`[server] PK Developer Builders & Advisor running at http://localhost:${env.port}`);
});
