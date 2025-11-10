// Minimal JS:
// - dynamic year
// - smooth-ish scroll via CSS (already set)
// - theme toggle (simple dark/light class)

(function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const root = document.documentElement;
  const DARK = "theme-dark";

  // Start in dark
  root.classList.add(DARK);

  toggle.addEventListener("click", () => {
    if (root.classList.contains(DARK)) {
      root.classList.remove(DARK);
      document.body.style.background =
        "radial-gradient(circle at top, #f9fafb 0, #e5e7eb 40%, #d1d5db 100%)";
      document.body.style.color = "#111827";
    } else {
      root.classList.add(DARK);
      document.body.style.background =
        "radial-gradient(circle at top, #111827 0, #020817 55%, #000 100%)";
      document.body.style.color = "#f5f5f5";
    }
  });
})();
