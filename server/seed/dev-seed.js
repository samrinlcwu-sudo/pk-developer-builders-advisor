// Inserts obviously-fake demo data for local development/testing only.
// Every row is name-prefixed "[DEMO] " AND flagged is_demo_seed = 1 so it
// can never be mistaken for real content and can be cleanly removed with
// `npm run db:reset`. Never run this against a production database.
const { runMigrations } = require("../db/migrate");
const locationModel = require("../models/location");
const agentModel = require("../models/agent");
const propertyModel = require("../models/property");
const { slugify } = require("../services/slugify");

function seed() {
  runMigrations();

  const location = locationModel.create({
    name: "[DEMO] Sample Town",
    slug: slugify("[DEMO] Sample Town"),
    city: "Sample City",
    region: "Sample Region",
    description: "Demo location for local testing only — not a real place PK Developer Builders & Advisor operates in.",
    isPublished: true,
    isDemoSeed: true,
  });

  const agent = agentModel.create({
    name: "[DEMO] Test Advisor",
    roleTitle: "Demo Advisor",
    phone: "000-000-0000",
    email: "demo@example.com",
    isPublished: true,
    isDemoSeed: true,
  });

  const demoProperties = [
    {
      title: "[DEMO] Sample Residential Home",
      type: "house",
      status: "available",
      price: 15000000,
      areaSqft: 2200,
      bedrooms: 4,
      bathrooms: 3,
      description: "This is placeholder demo content for local testing — not a real listing.",
      image: "/assets/demo-property-residential-home.jpg",
    },
    {
      title: "[DEMO] Sample Commercial Plaza",
      type: "commercial",
      status: "under-offer",
      price: 45000000,
      areaSqft: 6000,
      bedrooms: null,
      bathrooms: null,
      description: "This is placeholder demo content for local testing — not a real listing.",
      image: "/assets/demo-property-commercial-plaza.jpg",
    },
  ];

  for (const p of demoProperties) {
    const slug = slugify(p.title);
    if (propertyModel.slugExists(slug)) continue;
    const { image, ...propertyFields } = p;
    const property = propertyModel.create({
      ...propertyFields,
      slug,
      locationId: location.id,
      agentId: agent.id,
      isPublished: true,
      isDemoSeed: true,
    });
    propertyModel.replaceFeatures(property.id, ["Demo feature one", "Demo feature two"]);
    if (image) {
      propertyModel.addImage(property.id, { filePath: image, isPrimary: true, sortOrder: 0 });
    }
    console.log("[seed] Created demo property #%d: %s", property.id, property.title);
  }

  // The 7 Insights articles that used to be seeded here as demo content
  // were promoted to real published content (see migrate-real-articles.js)
  // once the client approved the text and cover images.

  console.log("[seed] Done. Run `npm run db:reset` to remove all demo data.");
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
