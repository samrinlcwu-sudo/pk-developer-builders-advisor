// Injects the CSRF token (from the <meta name="csrf-token"> tag rendered
// into every admin page) into every same-page POST form, so individual
// admin view templates never need to hand-write a hidden _csrf field.
(function () {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const token = meta ? meta.content : null;
  if (!token) return;

  document.querySelectorAll('form[method="post" i]').forEach((form) => {
    if (form.querySelector('input[name="_csrf"]')) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "_csrf";
    input.value = token;
    form.appendChild(input);
  });
})();
