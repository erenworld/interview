const storageKey = "databasestory-theme";

const getPreferredTheme = () => {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    const isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    button.setAttribute(
      "title",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  });
};

applyTheme(getPreferredTheme());

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const next = current === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
  });
});

document.querySelectorAll(".nav-toggle").forEach((toggle) => {
  const bar = toggle.closest(".topbar");
  const nav = bar ? bar.querySelector(".topnav") : null;
  if (!nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  });
});

const btns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".article-card");

if (btns.length && cards.length) {
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        if (filter === "all") {
          card.style.display = "";
          return;
        }

        const tags = [...card.querySelectorAll(".tag")].map((tag) =>
          tag.textContent.trim()
        );
        card.style.display = tags.includes(filter) ? "" : "none";
      });
    });
  });
}

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%#@";
const activeScrambles = new WeakMap();

document.querySelectorAll(".brand").forEach((brand) => {
  const original = brand.textContent.trim();
  brand.setAttribute("data-brand-label", original);
  let hasPlayedIntro = false;

  const runScramble = () => {
    if (activeScrambles.has(brand)) {
      window.clearInterval(activeScrambles.get(brand));
    }

    let frame = 0;
    const totalFrames = original.length + 6;
    const timer = window.setInterval(() => {
      const nextText = original
        .split("")
        .map((char, index) => {
          if (char === " ") {
            return " ";
          }

          if (index < frame / 2) {
            return original[index];
          }

          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        })
        .join("");

      brand.textContent = nextText;
      frame += 1;

      if (frame > totalFrames) {
        window.clearInterval(timer);
        activeScrambles.delete(brand);
        brand.textContent = original;
      }
    }, 38);

    activeScrambles.set(brand, timer);
  };

  const runIntroScramble = () => {
    if (hasPlayedIntro) {
      return;
    }

    hasPlayedIntro = true;
    runScramble();
  };

  brand.addEventListener("mouseenter", runScramble);
  brand.addEventListener("focus", runScramble);
  brand.addEventListener("mouseleave", () => {
    if (!activeScrambles.has(brand)) {
      brand.textContent = original;
    }
  });
  brand.addEventListener("blur", () => {
    if (!activeScrambles.has(brand)) {
      brand.textContent = original;
    }
  });

  window.setTimeout(runIntroScramble, 180);
});
