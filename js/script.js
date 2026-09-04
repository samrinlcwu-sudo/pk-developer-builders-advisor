// ===== Mobile nav toggle =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    navToggle.classList.toggle("active");
    document.body.classList.toggle("nav-open");
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("active");
      document.body.classList.remove("nav-open");
    });
  });
}

// ===== Scroll fade-in animations =====
const fadeEls = document.querySelectorAll(".fade-in");
if (fadeEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" }
  );
  fadeEls.forEach((el) => observer.observe(el));
}

// ===== Form submission helper (shared by the contact form and every
// .enquiry-form instance) — POSTs to the form's data-endpoint and shows
// its success/error state. =====
async function submitLeadForm(form, { onSuccess, onError }) {
  const endpoint = form.dataset.endpoint;
  const submitBtn = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const params = new URLSearchParams();
  formData.forEach((value, key) => params.append(key, value));

  if (submitBtn) submitBtn.disabled = true;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data.error && data.error.message) || "Something went wrong. Please try again.");
    }
    onSuccess();
  } catch (err) {
    onError(err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function showFormError(form, message) {
  const targetSelector = form.dataset.errorTarget;
  const errorEl = targetSelector ? document.querySelector(targetSelector) : null;
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("visible");
  } else {
    alert(message);
  }
}

// ===== Contact form =====
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const successMsg = document.querySelector("#form-success");
    const errorMsg = document.querySelector(contactForm.dataset.errorTarget);
    if (errorMsg) errorMsg.classList.remove("visible");
    submitLeadForm(contactForm, {
      onSuccess: () => {
        contactForm.reset();
        if (successMsg) {
          successMsg.classList.add("visible");
          successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
      onError: (err) => showFormError(contactForm, err.message),
    });
  });
}

// ===== Property search/filter (client-side only, filters placeholder cards) =====
function initPropertySearchFilter() {
  const searchBar = document.querySelector(".property-search-bar");
  const cards = document.querySelectorAll(".property-card");
  const noResults = document.querySelector("#property-no-results");
  if (!searchBar || !cards.length) return;

  const filterIds = ["filter-type", "filter-location", "filter-price", "filter-area", "filter-bedrooms", "filter-bathrooms", "filter-status"];

  function applyFilters() {
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches = filterIds.every((id) => {
        const field = document.querySelector(`#${id}`);
        const value = field ? field.value : "";
        if (!value) return true;
        const dataKey = id.replace("filter-", "");
        return card.dataset[dataKey] === value;
      });
      card.style.display = matches ? "" : "none";
      if (matches) visibleCount++;
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  searchBar.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });
}
initPropertySearchFilter();

// ===== Insights category filter =====
function initInsightsCategoryFilter() {
  const pills = document.querySelectorAll(".category-pill");
  const articles = document.querySelectorAll(".article-card[data-category]");
  if (!pills.length || !articles.length) return;

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const category = pill.dataset.category;
      articles.forEach((article) => {
        article.style.display = category === "all" || article.dataset.category === category ? "" : "none";
      });
    });
  });
}
initInsightsCategoryFilter();

// ===== Enquiry forms (project/property detail pages) =====
function initEnquiryForms() {
  document.querySelectorAll(".enquiry-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const targetSelector = form.dataset.successTarget;
      const successMsg = targetSelector ? document.querySelector(targetSelector) : null;
      const errorMsg = document.querySelector(form.dataset.errorTarget);
      if (errorMsg) errorMsg.classList.remove("visible");
      submitLeadForm(form, {
        onSuccess: () => {
          form.reset();
          if (successMsg) {
            successMsg.classList.add("visible");
            successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        },
        onError: (err) => showFormError(form, err.message),
      });
    });
  });
}
initEnquiryForms();

// ===== WhatsApp click-to-chat (only appears once a real number is set
// in the admin panel — never fabricated or guessed client-side) =====
async function initWhatsAppButton() {
  try {
    const res = await fetch("/api/v1/site-settings/public");
    if (!res.ok) return;
    const { data } = await res.json();
    if (!data || !data.whatsappNumber) return;

    const link = document.createElement("a");
    link.href = `https://wa.me/${data.whatsappNumber}`;
    link.className = "whatsapp-float";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Chat with us on WhatsApp");
    link.innerHTML =
      '<svg viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.23 8.23 0 0 1-1.26-4.37c0-4.55 3.71-8.26 8.27-8.26 2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.84c0 4.56-3.71 8.24-8.27 8.24zm4.53-6.19c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.3-.23.24-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.16 1.76 2.69 4.26 3.77.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';
    link.addEventListener("click", () => {
      navigator.sendBeacon && navigator.sendBeacon("/whatsapp-click", new Blob([], { type: "application/x-www-form-urlencoded" }));
    });
    document.body.appendChild(link);
  } catch {
    // Silently skip — the button is a nice-to-have, never worth breaking the page over.
  }
}
initWhatsAppButton();

// ===== AI chat widget =====
// Conversation history lives only in memory for this page view — no
// server-side session, resets on reload. The assistant is grounded in real
// published site data server-side; this code just handles the UI + fetch.
function initChatWidget() {
  const history = [];

  const toggle = document.createElement("button");
  toggle.className = "chat-toggle";
  toggle.setAttribute("aria-label", "Open chat");
  toggle.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="chat-panel-header">
      <span>Chat with us</span>
      <button type="button" class="chat-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="chat-messages" role="log" aria-live="polite"></div>
    <form class="chat-input-row">
      <input type="text" class="chat-input" placeholder="Ask about a property or service..." maxlength="2000" autocomplete="off" />
      <button type="submit" class="btn btn-primary chat-send">Send</button>
    </form>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector(".chat-messages");
  const form = panel.querySelector(".chat-input-row");
  const input = panel.querySelector(".chat-input");

  function addBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble--${role}`;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-label", "Close chat");
    if (!history.length) {
      addBubble("assistant", "Hi! Ask me about our properties, projects, or services.");
    }
    input.focus();
  }
  function close() {
    panel.hidden = true;
    toggle.setAttribute("aria-label", "Open chat");
  }

  toggle.addEventListener("click", () => (panel.hidden ? open() : close()));
  panel.querySelector(".chat-close").addEventListener("click", close);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addBubble("user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;

    const typing = addBubble("assistant", "...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typing.remove();
      if (!res.ok) {
        addBubble("assistant", (data && data.error && data.error.message) || "Something went wrong. Please try again.");
      } else {
        addBubble("assistant", data.reply);
        history.push({ role: "assistant", content: data.reply });
      }
    } catch {
      typing.remove();
      addBubble("assistant", "Connection issue — please try again in a moment.");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}
initChatWidget();
