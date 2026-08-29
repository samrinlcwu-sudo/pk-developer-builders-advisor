// ===== Mobile nav toggle =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
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
    { threshold: 0.15 }
  );
  fadeEls.forEach((el) => observer.observe(el));
}

// ===== Contact form (front-end only — no backend wired up yet) =====
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    // NOTE: This form does not send data anywhere yet. Wiring it to a real
    // inbox/CRM (backend endpoint or a form service) is a setup step for
    // the business owner — see README.md.
    const successMsg = document.querySelector("#form-success");
    if (successMsg) {
      contactForm.reset();
      successMsg.classList.add("visible");
      successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}
