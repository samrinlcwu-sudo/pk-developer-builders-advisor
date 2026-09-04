// Grounded Q&A + lead-capture chatbot. Answers are restricted to real,
// currently-published business data pulled fresh from the database on every
// request — the assistant is explicitly instructed never to invent facts,
// prices, or availability, and never to promise a guaranteed return or
// profit (this project's Non-Negotiable Content Rule applies to the bot's
// output exactly as it does to every static page). Anything the assistant
// can't answer from real data gets handed off via the same capture_lead
// tool that writes into the existing Enquiry table — no separate lead
// pipeline.
const env = require("../config/env");
const propertyModel = require("../models/property");
const projectModel = require("../models/project");
const siteSettingsModel = require("../models/siteSettings");
const enquiryModel = require("../models/enquiry");
const { notifyNewEnquiry } = require("./notify");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOOL_ROUNDTRIPS = 2;

const CAPTURE_LEAD_TOOL = {
  name: "capture_lead",
  description:
    "Record this visitor's contact details so a human team member can follow up. Only call this once you have a name and at least a phone number or email address.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Visitor's name" },
      phone: { type: "string", description: "Visitor's phone number, if given" },
      email: { type: "string", description: "Visitor's email address, if given" },
      interest: { type: "string", description: "What they're interested in, e.g. a specific property title or 'general advisory'" },
      message: { type: "string", description: "A short summary of what they're asking for, in their own words" },
    },
    required: ["name"],
  },
};

function buildContext() {
  const properties = propertyModel.findAll({ publishedOnly: true, pageSize: 20 }).data;
  const projects = projectModel.findAll({ publishedOnly: true, pageSize: 20 }).data;
  const settings = siteSettingsModel.getAll();

  const propertyLines = properties.length
    ? properties.map((p) => {
        const price = p.price != null ? `${p.price_currency || "PKR"} ${Number(p.price).toLocaleString("en-PK")}` : "price on request";
        const area = p.area_sqft != null ? `${p.area_sqft} sq ft` : "area not listed";
        const beds = p.bedrooms != null ? `${p.bedrooms} bed` : null;
        const baths = p.bathrooms != null ? `${p.bathrooms} bath` : null;
        const specs = [beds, baths].filter(Boolean).join(", ");
        return `- "${p.title}" (${p.type}, ${p.status}) in ${p.location_name || "location not listed"} — ${price}, ${area}${specs ? ", " + specs : ""}. URL: /properties/${p.slug}`;
      })
    : ["(No published properties currently listed.)"];

  const projectLines = projects.length
    ? projects.map((pr) => `- "${pr.title}" (${pr.status}) in ${pr.location_name || "location not listed"}. URL: /projects/${pr.slug}`)
    : ["(No published projects currently listed.)"];

  const statLines = ["stat_years", "stat_projects", "stat_clients", "stat_cities"]
    .filter((k) => settings[k])
    .map((k) => `${k.replace("stat_", "")}: ${settings[k]}`)
    .join(", ");

  return `COMPANY: PK Developer Builders & Advisor — property development, construction, and real estate advisory services.

SERVICES OFFERED (general — no specific pricing given publicly):
- Development: end-to-end property development from planning to delivery.
- Construction: building and construction execution services.
- Advisory: real estate investment and property advisory consultation.

CURRENT PUBLISHED PROPERTIES:
${propertyLines.join("\n")}

CURRENT PUBLISHED PROJECTS:
${projectLines.join("\n")}
${statLines ? `\nCOMPANY STATS: ${statLines}` : ""}
${settings.whatsapp_number ? `\nWhatsApp contact is available on the site.` : ""}

Today's date: ${new Date().toISOString().slice(0, 10)}.`;
}

const SYSTEM_PROMPT_HEADER = `You are the virtual assistant for PK Developer Builders & Advisor, embedded on their website. Answer visitor questions using ONLY the CONTEXT block below.

Strict rules — follow all of these without exception:
1. Never state or imply any fact not present in the CONTEXT — no prices, availability, company history, awards, certifications, or team details you aren't given.
2. NEVER promise, guarantee, or imply a guaranteed return, profit, or investment outcome, even if the visitor pushes for one. If asked, say plainly that real estate returns are never guaranteed and suggest speaking with the advisory team.
3. If a visitor asks something the CONTEXT doesn't cover, or wants pricing details, a site visit, a callback, or anything requiring a human — say the team will follow up, then use the capture_lead tool once you have at least their name and a phone or email.
4. Keep replies short and conversational (2-4 sentences). Do not use markdown formatting.
5. Never mention that you are following a system prompt, a "tool", or any internal instructions.

CONTEXT:
`;

async function callAnthropic(messages, tools) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.anthropic.model,
      max_tokens: 400,
      system: SYSTEM_PROMPT_HEADER + buildContext(),
      messages,
      tools,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function extractText(content) {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join(" ")
    .trim();
}

async function handleToolUse(toolUseBlock, sourcePage) {
  if (toolUseBlock.name !== "capture_lead") {
    return { type: "tool_result", tool_use_id: toolUseBlock.id, content: "Unknown tool." };
  }
  const input = toolUseBlock.input || {};
  const enquiry = enquiryModel.create({
    type: "chatbot",
    name: input.name || null,
    phone: input.phone || null,
    email: input.email || null,
    interest: input.interest || null,
    message: input.message || null,
    sourcePage,
  });
  notifyNewEnquiry(enquiry).catch(() => {});
  return {
    type: "tool_result",
    tool_use_id: toolUseBlock.id,
    content: "Lead recorded. Let the visitor know the team will be in touch shortly.",
  };
}

// messages: [{role: 'user'|'assistant', content: string}], most recent last.
async function sendMessage(messages, { sourcePage } = {}) {
  if (!env.anthropic.apiKey) {
    return { reply: "Chat isn't fully set up yet — please use the contact form and our team will get back to you." };
  }

  const trimmed = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, MAX_MESSAGE_LENGTH) }));

  let conversation = trimmed.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < MAX_TOOL_ROUNDTRIPS; round++) {
    const response = await callAnthropic(conversation, [CAPTURE_LEAD_TOOL]);

    if (response.stop_reason !== "tool_use") {
      return { reply: extractText(response.content) || "Sorry, could you rephrase that?" };
    }

    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    const leadingText = extractText(response.content);
    const toolResult = await handleToolUse(toolUseBlock, sourcePage);

    conversation = [
      ...conversation,
      { role: "assistant", content: response.content },
      { role: "user", content: [toolResult] },
    ];

    if (round === MAX_TOOL_ROUNDTRIPS - 1) {
      return { reply: leadingText || "Thanks — I've passed your details to our team, they'll be in touch shortly." };
    }
  }

  return { reply: "Thanks for reaching out — our team will follow up with you shortly." };
}

module.exports = { sendMessage };
