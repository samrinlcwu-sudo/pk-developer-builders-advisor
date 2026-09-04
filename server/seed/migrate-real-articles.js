// One-time migration promoting the 7 Insights articles (originally created
// via the demo seed script for local testing) to real, published content —
// same text and cover images, approved by the client. Not demo data —
// is_demo_seed stays 0, titles drop the "[DEMO] " prefix, and slugs are
// generated fresh (the demo versions had "demo-" baked into their slugs).
// Safe to re-run: every insert is guarded by slug so it never duplicates.
const { runMigrations } = require("../db/migrate");
const articleModel = require("../models/article");
const { slugify } = require("../services/slugify");

const articles = [
  {
    title: "A First-Time Buyer's Guide to Property Types",
    category: "real-estate",
    excerpt: "A quick primer on residential, commercial, and mixed-use property types, and how to match one to your goals.",
    body: "Before comparing listings, it helps to be clear on what kind of property actually fits your purpose. A house or apartment suits owner-occupiers who value privacy or low maintenance respectively; a plot suits buyers who want to build to their own design and timeline; commercial space suits an income or business purpose rather than personal living.\n\nWhichever category you're looking at, the same due-diligence habits apply: verify ownership and title documents independently, confirm the property is free of disputes or liens, and have any construction inspected by someone qualified before you commit. Location fundamentals — access roads, utilities, nearby development plans — tend to matter more to long-term satisfaction than finishes do.\n\nFinally, budget for more than the sticker price. Registration, transfer charges, legal fees, and any near-term renovation should all factor into what you can actually afford.",
    coverImagePath: "/assets/insight-first-time-buyer.jpg",
    isFeatured: true,
    publishedAt: "2026-08-10",
  },
  {
    title: "Key Factors to Weigh Before a Property Investment",
    category: "investment",
    excerpt: "Before committing capital to a property, these are the fundamentals worth reviewing first.",
    body: "Property can be a reasonable way to build long-term value, but it isn't a guaranteed return, and short-term price movements are never certain. Treat any specific return figure you hear — from a seller, an agent, or a forum post — as a claim to verify, not a fact to bank on.\n\nA few fundamentals are worth checking regardless of the specific property: how liquid is this type of asset if you need to exit early, what's your realistic holding period, and how does financing cost factor into your actual return. Location fundamentals (infrastructure, employment centers, transport links) tend to hold up better over time than speculation on rumored future projects.\n\nDiversification applies to real estate the same way it does to any other asset class — concentrating everything in a single property or a single developer's project carries more risk than spreading it. Where the numbers matter, it's worth having a licensed financial or tax advisor review the specifics with you rather than relying on informal advice alone.",
    coverImagePath: "/assets/insight-investment-factors.jpg",
    isFeatured: false,
    publishedAt: "2026-08-17",
  },
  {
    title: "What Happens During Each Phase of Construction",
    category: "construction",
    excerpt: "From site preparation to handover, here's what a typical construction timeline involves.",
    body: "Construction generally moves through a predictable sequence: site survey and soil testing, foundation work, structural framing, roofing, then the rough-in of electrical, plumbing, and mechanical systems before walls are closed up. Finishing work — flooring, fixtures, paint — comes last, followed by inspections and handover.\n\nTimelines shift for reasons that are mostly outside anyone's direct control: weather delays, municipal approval turnaround, and material lead times are the most common culprits. A realistic schedule builds in buffer for these rather than assuming a best-case run.\n\nRegular third-party inspection at each phase — not just at the end — is what actually catches problems while they're still cheap to fix. Asking to see inspection records, not just a finished photo, is a reasonable thing for any client to expect.",
    coverImagePath: "/assets/insight-construction-phases.jpg",
    isFeatured: false,
    publishedAt: "2026-08-24",
  },
  {
    title: "How Mixed-Use Developments Get Planned",
    category: "development",
    excerpt: "Turning raw land into a functioning neighborhood involves more coordination than most buyers realize.",
    body: "A mixed-use development starts long before the first foundation is poured. Master planning has to balance residential, commercial, and shared green space against the site's actual constraints — road access, utility capacity, zoning rules, and the surrounding neighborhood's existing character.\n\nInfrastructure — roads, drainage, power, water — usually has to be built out ahead of or alongside the first structures, which is part of why large developments are typically delivered in phases rather than all at once. Phasing also lets a developer respond to how early phases actually perform before committing further capital.\n\nThe long-term success of a development depends as much on what happens after handover — shared-area maintenance, community management, upkeep of common amenities — as it does on the initial construction quality.",
    coverImagePath: "/assets/insight-mixed-use-planning.jpg",
    isFeatured: false,
    publishedAt: "2026-08-31",
  },
  {
    title: "How to Read Local Property Market Signals",
    category: "market-insights",
    excerpt: "Instead of chasing headlines, here are indicators that say more about a local market's actual direction.",
    body: "Broad national headlines rarely tell you much about a specific neighborhood. More useful signals tend to be local: how long similar listings are staying on the market before selling, whether asking prices are being revised up or down, and how much new supply is in the pipeline nearby.\n\nRental yield trends are also worth tracking independently of sale prices — an area where rents are climbing while sale prices stay flat is telling a different story than one where both are moving together. Nearby infrastructure projects (transit, roads, utilities) and employment trends are typically better long-term indicators than short-term price swings.\n\nNone of these signals predict outcomes with certainty, and past trends don't guarantee future ones. They're inputs for a conversation with a qualified advisor about a specific property, not a substitute for one.",
    coverImagePath: "/assets/insight-market-signals.png",
    isFeatured: false,
    publishedAt: "2026-09-02",
  },
  {
    title: "A Step-by-Step Guide to the Property Buying Process",
    category: "guides",
    excerpt: "From shortlisting to handover, here's the general sequence a property purchase tends to follow.",
    body: "The process usually starts with defining a realistic budget — including financing pre-approval if you'll need it — before shortlisting properties, since knowing what you can actually afford narrows the search faster than browsing first. Site visits and an independent inspection follow, ideally with someone qualified who isn't the seller's own representative.\n\nOnce you've settled on a property, due diligence comes next: verifying the title and ownership chain, confirming there are no outstanding disputes or liens, and reviewing any relevant approvals or permits. Only after that should an offer be made and a sale agreement drafted — ideally reviewed by your own legal counsel, not just the seller's.\n\nRegistration and transfer of ownership formally closes the purchase, and it's worth confirming utility accounts, property tax records, and any society or community dues are transferred into your name promptly afterward.",
    coverImagePath: "/assets/insight-buying-process.png",
    isFeatured: false,
    publishedAt: "2026-08-05",
  },
  {
    title: "A Practical Checklist for Property Documentation",
    category: "guides",
    excerpt: "The paperwork that's worth confirming before any property changes hands.",
    body: "Documentation requirements vary by jurisdiction and property type, but a few categories come up in almost every transaction: proof of ownership and the chain of title, an up-to-date survey or site plan, and confirmation that property taxes and utility bills are current with no outstanding dues.\n\nFor anything built rather than raw land, it's worth confirming the construction was approved and completed in line with the sanctioned plan — an unapproved addition or deviation can complicate a resale or a mortgage later even if it isn't a problem today. For plots or land specifically, zoning classification and any usage restrictions are worth confirming independently rather than taking a seller's word for it.\n\nKeep copies of everything — the original documents, any correspondence with authorities, and the final registered sale deed — in more than one place. Missing paperwork is one of the most common reasons a straightforward resale gets held up later.",
    coverImagePath: "/assets/insight-documentation-checklist.jpg",
    isFeatured: false,
    publishedAt: "2026-08-27",
  },
];

function migrate() {
  runMigrations();

  for (const a of articles) {
    const slug = slugify(a.title);
    if (articleModel.slugExists(slug)) continue;
    const article = articleModel.create({
      slug,
      title: a.title,
      category: a.category,
      authorName: "Editorial Team",
      excerpt: a.excerpt,
      body: a.body,
      coverImagePath: a.coverImagePath,
      isFeatured: a.isFeatured,
      publishedAt: a.publishedAt,
      isPublished: true,
      isDemoSeed: false,
    });
    console.log("[migrate-real] Created article #%d: %s", article.id, article.title);
  }

  console.log("[migrate-real] Articles done.");
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
