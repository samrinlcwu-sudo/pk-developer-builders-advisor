// One-time migration of the REAL (already-published, client-approved)
// content that used to be hard-coded in about.html/index.html into the
// database, now that those pages are server-rendered. This is not demo
// data — is_demo_seed stays 0 and these rows are real business facts that
// were already live on the site before the backend existed. Safe to
// re-run: each insert is guarded so it never creates duplicates.
const { runMigrations } = require("../db/migrate");
const teamMemberModel = require("../models/teamMember");
const testimonialModel = require("../models/testimonial");
const siteSettingsModel = require("../models/siteSettings");

function migrate() {
  runMigrations();

  const existingTeam = teamMemberModel.findAllForAdmin();
  if (!existingTeam.some((m) => m.name === "M. Zeeshan Awan")) {
    teamMemberModel.create({
      name: "M. Zeeshan Awan",
      roleTitle: "Founder & CEO",
      bio: null,
      photoPath: null,
      sortOrder: 0,
      isPublished: true,
      isDemoSeed: false,
    });
    console.log("[migrate] Created team member: M. Zeeshan Awan");
  }

  const existingTestimonials = testimonialModel.findAllForAdmin();
  const realTestimonials = [
    {
      quote:
        "PK Developer Builders & Advisor made the entire process smooth and well-organized. Their team was responsive, transparent, and committed to delivering quality work.",
      authorName: "Ahmed R.",
      authorRole: "Property Investor",
      sortOrder: 0,
    },
    {
      quote:
        "We appreciated their attention to detail and the way they handled every stage of the project. The team maintained good communication and delivered work to a high standard.",
      authorName: "Muhammad H.",
      authorRole: "Homeowner",
      sortOrder: 1,
    },
    {
      quote:
        "From planning and consultation to execution, the team demonstrated professionalism and genuine commitment to our project. Their practical advice helped us make confident decisions.",
      authorName: "Salman K.",
      authorRole: "Business Owner",
      sortOrder: 2,
    },
  ];

  for (const t of realTestimonials) {
    if (existingTestimonials.some((e) => e.author_name === t.authorName && e.quote === t.quote)) continue;
    testimonialModel.create({ ...t, isVerified: true, isPublished: true, isDemoSeed: false });
    console.log("[migrate] Created testimonial from %s", t.authorName);
  }

  const existingSettings = siteSettingsModel.getAll();
  const realStats = { stat_years: "16+", stat_projects: "75+", stat_clients: "250+", stat_cities: "8+" };
  Object.entries(realStats).forEach(([key, value]) => {
    if (existingSettings[key] != null) return;
    siteSettingsModel.set(key, value);
    console.log("[migrate] Set site setting %s = %s", key, value);
  });

  console.log("[migrate] Done.");
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
