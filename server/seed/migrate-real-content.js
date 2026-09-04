// One-time migration of REAL (non-demo) content created through the local
// admin panel, so it also exists in any other environment's database
// (e.g. a freshly-provisioned production volume that only ever got the
// schema). Not demo data — is_demo_seed stays 0. Safe to re-run: every
// insert is guarded by slug so it never creates duplicates.
const { runMigrations } = require("../db/migrate");
const locationModel = require("../models/location");
const propertyModel = require("../models/property");

function migrate() {
  runMigrations();

  let location = locationModel.findBySlug("gujar-khan");
  if (!location) {
    location = locationModel.create({
      name: "Gujar Khan",
      slug: "gujar-khan",
      city: "Gujar Khan",
      region: "Rawalpindi District, Punjab",
      description:
        "Located on Main GT Road, Gujar Khan — roughly 45 minutes from Rawalpindi/Islamabad, with direct access to commercial centers, schools, and healthcare facilities.",
      isPublished: false,
      isDemoSeed: false,
    });
    console.log("[migrate-real] Created location: Gujar Khan");
  }

  const propertySlug = "premium-executive-unit-by-pk-developers-gujar-khan";
  if (!propertyModel.slugExists(propertySlug)) {
    const property = propertyModel.create({
      slug: propertySlug,
      title: "Premium Executive Unit by PK Developers – Gujar Khan",
      type: "apartment",
      status: "available",
      locationId: location.id,
      price: 7525000,
      priceCurrency: "PKR",
      areaSqft: 2150,
      bedrooms: 3,
      bathrooms: 2,
      description:
        "A prime property opportunity in Gujar Khan, Rawalpindi, brought to you by PK Developer Builders & Advisor. Engineered with modern structural standards and premium architectural finishes, this development offers flexible residential and commercial spaces starting at an accessible rate of PKR 3,500 per sq. ft. Ideal for both investors seeking strong ROI in a high-growth corridor and families searching for modern, secure community living.\r\n\r\nDelivery: expected 2026 (currently under construction). Includes one reserved covered parking space and an estimated monthly maintenance/service fee of PKR 5,000. Configured as 3 bedrooms and 2.5 bathrooms (2 full baths plus a half bath).",
      isPublished: false,
      isDemoSeed: false,
    });
    propertyModel.replaceFeatures(property.id, [
      "Modern open-plan layout",
      "Porcelain floor tiles",
      "Granite/quartz countertops",
      "Pre-wired smart home connections",
      "Double-glazed windows",
      "Standby generator backup",
      "24/7 CCTV surveillance & gated security",
      "High-speed elevators",
      "Executive entry lobby",
      "Rooftop terrace",
      "1 reserved covered parking space",
      "Prime GT Road connectivity",
      "Close to schools and healthcare facilities",
      "Approx. 45 minutes from Rawalpindi/Islamabad",
    ]);
    console.log("[migrate-real] Created property: %s", property.title);
  }

  console.log("[migrate-real] Done.");
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
