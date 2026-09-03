const PROPERTY_TYPES = ["residential", "commercial", "plot", "house", "apartment", "office", "shop"];
const PROPERTY_STATUSES = ["available", "under-offer", "sold", "rented"];
const PROJECT_STATUSES = ["upcoming", "ongoing", "completed", "available"];
const VERIFIED_FEATURE_CATEGORIES = ["architecture", "security", "parking", "landscaping"];
const ARTICLE_CATEGORIES = ["real-estate", "investment", "construction", "development", "market-insights", "guides"];
const ENQUIRY_TYPES = ["consultation", "property-info", "project-info", "viewing", "advisory", "contact", "whatsapp-click"];
const ENQUIRY_STATUSES = ["new", "contacted", "qualified", "closed"];

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableInt(value) {
  const n = toNullableNumber(value);
  return n === null ? null : Math.trunc(n);
}

function sanitizeText(value, maxLength = 5000) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, maxLength);
}

function validatePropertyFields(body) {
  const errors = [];

  const title = sanitizeText(body.title, 200);
  if (!title) errors.push("Title is required.");

  const type = sanitizeText(body.type, 50);
  if (!PROPERTY_TYPES.includes(type)) errors.push("A valid property type is required.");

  const status = sanitizeText(body.status, 50) || "available";
  if (!PROPERTY_STATUSES.includes(status)) errors.push("A valid status is required.");

  const locationId = toNullableInt(body.locationId);

  return {
    errors,
    fields: {
      title,
      type,
      status,
      locationId,
      price: toNullableNumber(body.price),
      areaSqft: toNullableNumber(body.areaSqft),
      bedrooms: toNullableInt(body.bedrooms),
      bathrooms: toNullableInt(body.bathrooms),
      description: sanitizeText(body.description, 5000),
      mapEmbedUrl: sanitizeText(body.mapEmbedUrl, 2000),
      agentId: toNullableInt(body.agentId),
    },
  };
}

function validateLocationFields(body) {
  const errors = [];
  const name = sanitizeText(body.name, 200);
  if (!name) errors.push("Name is required.");
  return {
    errors,
    fields: {
      name,
      city: sanitizeText(body.city, 120),
      region: sanitizeText(body.region, 120),
      description: sanitizeText(body.description, 2000),
    },
  };
}

function validateAgentFields(body) {
  const errors = [];
  const name = sanitizeText(body.name, 200);
  if (!name) errors.push("Name is required.");
  return {
    errors,
    fields: {
      name,
      roleTitle: sanitizeText(body.roleTitle, 120),
      phone: sanitizeText(body.phone, 60),
      email: sanitizeText(body.email, 200),
    },
  };
}

function validateProjectFields(body) {
  const errors = [];

  const title = sanitizeText(body.title, 200);
  if (!title) errors.push("Title is required.");

  const status = sanitizeText(body.status, 50) || "upcoming";
  if (!PROJECT_STATUSES.includes(status)) errors.push("A valid status is required.");

  return {
    errors,
    fields: {
      title,
      status,
      locationId: toNullableInt(body.locationId),
      overview: sanitizeText(body.overview, 5000),
      propertyType: sanitizeText(body.propertyType, 100),
    },
  };
}

function validateTeamMemberFields(body) {
  const errors = [];
  const name = sanitizeText(body.name, 200);
  if (!name) errors.push("Name is required.");
  return {
    errors,
    fields: {
      name,
      roleTitle: sanitizeText(body.roleTitle, 120),
      bio: sanitizeText(body.bio, 3000),
      sortOrder: toNullableInt(body.sortOrder) || 0,
    },
  };
}

function validateTestimonialFields(body) {
  const errors = [];
  const quote = sanitizeText(body.quote, 2000);
  if (!quote) errors.push("Quote is required.");
  const authorName = sanitizeText(body.authorName, 200);
  if (!authorName) errors.push("Author name is required.");
  return {
    errors,
    fields: {
      quote,
      authorName,
      authorRole: sanitizeText(body.authorRole, 120),
      sortOrder: toNullableInt(body.sortOrder) || 0,
    },
  };
}

function validateArticleFields(body) {
  const errors = [];

  const title = sanitizeText(body.title, 200);
  if (!title) errors.push("Title is required.");

  const category = sanitizeText(body.category, 50);
  if (!ARTICLE_CATEGORIES.includes(category)) errors.push("A valid category is required.");

  const publishedAt = sanitizeText(body.publishedAt, 20);

  return {
    errors,
    fields: {
      title,
      category,
      authorName: sanitizeText(body.authorName, 120),
      excerpt: sanitizeText(body.excerpt, 500),
      body: sanitizeText(body.body, 20000),
      publishedAt: publishedAt || null,
    },
  };
}

function validateEnquiryFields(body) {
  const errors = [];

  const name = sanitizeText(body.name, 200);
  if (!name) errors.push("Name is required.");

  const phone = sanitizeText(body.phone, 60);
  const email = sanitizeText(body.email, 200);
  if (!phone && !email) errors.push("A phone number or email is required.");

  const message = sanitizeText(body.message, 3000);

  return {
    errors,
    fields: {
      name,
      phone,
      email,
      message,
      interest: sanitizeText(body.interest, 100),
    },
  };
}

module.exports = {
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  PROJECT_STATUSES,
  VERIFIED_FEATURE_CATEGORIES,
  ARTICLE_CATEGORIES,
  ENQUIRY_TYPES,
  ENQUIRY_STATUSES,
  toNullableNumber,
  toNullableInt,
  sanitizeText,
  validatePropertyFields,
  validateLocationFields,
  validateAgentFields,
  validateProjectFields,
  validateTeamMemberFields,
  validateTestimonialFields,
  validateArticleFields,
  validateEnquiryFields,
};
