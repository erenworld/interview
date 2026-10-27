// Titles use the visitor's own Futura Condensed ExtraBold; flag the fallback.
if (document.fonts && document.fonts.load) {
  document.fonts
    .load('700 1em "DS Title"')
    .then((faces) => {
      if (!faces.length) {
        document.documentElement.classList.add("title-fallback");
      }
    })
    .catch(() => document.documentElement.classList.add("title-fallback"));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mark the current page in the menu.
document.querySelectorAll(".topnav .menu-card").forEach((link, index) => {
  link.style.setProperty("--stagger-index", index);
  const target = new URL(link.href, window.location.href);
  if (!target.hash && target.pathname === window.location.pathname) {
    link.setAttribute("aria-current", "page");
  }
});

// Mobile menu: open/close with the panel and link stagger defined in CSS.
const menuControls = [];
document.querySelectorAll(".nav-toggle").forEach((toggle) => {
  const bar = toggle.closest(".topbar");
  const nav = bar ? bar.querySelector(".topnav") : null;
  if (!nav) {
    return;
  }

  let closeTimer = 0;
  const setOpen = (open) => {
    window.clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("menu-open", open);
    if (open) {
      nav.classList.remove("is-closing");
      nav.classList.add("is-open");
      return;
    }
    if (!nav.classList.contains("is-open")) {
      return;
    }
    nav.classList.add("is-closing");
    nav.classList.remove("is-open");
    closeTimer = window.setTimeout(() => nav.classList.remove("is-closing"), 250);
  };
  menuControls.push(setOpen);

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
});

// Smooth scroll to same-page anchors (1.6s, power2.inOut like acquired.fm).
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href*="#"]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
    return;
  }
  const url = new URL(link.href, window.location.href);
  if (url.pathname !== window.location.pathname || !url.hash) {
    return;
  }
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) {
    return;
  }
  event.preventDefault();
  menuControls.forEach((setOpen) => setOpen(false));

  const topbar = document.querySelector(".topbar");
  const offset = topbar ? topbar.offsetHeight : 0;
  const from = window.scrollY;
  const to = Math.max(0, target.getBoundingClientRect().top + from - offset);
  history.pushState(null, "", url.hash);

  if (prefersReducedMotion) {
    window.scrollTo(0, to);
    return;
  }
  const duration = 1600;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + (to - from) * easeInOutQuad(t));
    if (t < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
});

document.querySelectorAll("[data-beehiiv-form]").forEach((form) => {
  const status = document.querySelector("[data-beehiiv-status]");
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    if (!email) {
      if (status) {
        status.textContent = "Enter a valid email.";
      }
      return;
    }

    if (button) {
      button.disabled = true;
    }
    if (status) {
      status.textContent = "Submitting...";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new URLSearchParams({ email }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      form.reset();
      if (status) {
        status.textContent = "Subscribed.";
      }
    } catch (error) {
      if (status) {
        status.textContent =
          "Beehiiv likely needs a public subscribe endpoint or API key. This settings URL usually won't accept a browser signup directly.";
      }
      console.error(error);
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
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

// Sticky audio player. Set it to the episode to play, e.g.
//   { title: "Name, Role @Company", src: "assets/audio/<slug>.mp3", page: "articles/<slug>.html" }
// (paths relative to the site root), or null for no player.
const audioEpisode = {
  title: "Alex Padula, Founder & Architect @TidesDB",
  src: "assets/audio/alex-padula.mp3",
  page: "articles/alex-padula.html",
};

(() => {
  if (!audioEpisode) {
    return;
  }
  // Interviews get the read-aloud player instead (see "Read aloud" below).
  if (document.querySelector(".article-page[data-guest]") && "speechSynthesis" in window) {
    return;
  }
  // A player kept alive across a page change (see "Keep the audio playing") stays the only one.
  if (document.querySelector(".audio-player")) {
    return;
  }
  const siteRoot = new URL(".", document.currentScript.src);
  const positionKey = "databasestory-audio";
  const speeds = [1, 1.25, 1.5, 2];

  const icons = {
    back: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" stroke-linecap="round"/><path d="M4 3.5v4h4" stroke-linecap="round" stroke-linejoin="round"/><text x="12" y="15.4" text-anchor="middle" font-size="7.5" font-family="Arial, sans-serif" font-weight="700" fill="currentColor" stroke="none">10</text></svg>',
    forward: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" stroke-linecap="round"/><path d="M20 3.5v4h-4" stroke-linecap="round" stroke-linejoin="round"/><text x="12" y="15.4" text-anchor="middle" font-size="7.5" font-family="Arial, sans-serif" font-weight="700" fill="currentColor" stroke="none">30</text></svg>',
    play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1"/><rect x="13.5" y="4" width="4.5" height="16" rx="1"/></svg>',
    volume: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return "--:--";
    }
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${String(m).padStart(2, "0")}:${s}`;
  };

  const player = document.createElement("div");
  player.className = "audio-player";
  player.setAttribute("role", "region");
  player.setAttribute("aria-label", "Audio player");
  player.innerHTML = `
    <div class="audio-inner">
      <div class="audio-controls">
        <button class="audio-btn" type="button" data-skip="-10" aria-label="Back 10 seconds">${icons.back}</button>
        <button class="audio-btn audio-play" type="button" aria-label="Play">${icons.play}</button>
        <button class="audio-btn" type="button" data-skip="30" aria-label="Forward 30 seconds">${icons.forward}</button>
      </div>
      <div class="audio-main">
        <a class="audio-title" href="${new URL(audioEpisode.page, siteRoot)}">${audioEpisode.title}</a>
        <input class="audio-progress" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek" />
        <div class="audio-times"><span class="audio-current">00:00</span><span class="audio-duration">--:--</span></div>
      </div>
      <div class="audio-extra">
        <button class="audio-speed" type="button" aria-label="Playback speed">1x</button>
        <button class="audio-btn audio-mute" type="button" aria-label="Mute">${icons.volume}</button>
      </div>
    </div>`;
  document.body.appendChild(player);
  document.body.classList.add("has-audio-player");

  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = new URL(audioEpisode.src, siteRoot).href;
  window.__dsAudioPlaying = () => !audio.paused;

  const playBtn = player.querySelector(".audio-play");
  const muteBtn = player.querySelector(".audio-mute");
  const speedBtn = player.querySelector(".audio-speed");
  const progress = player.querySelector(".audio-progress");
  const current = player.querySelector(".audio-current");
  const duration = player.querySelector(".audio-duration");
  let seeking = false;

  const readState = () => {
    try {
      return JSON.parse(window.sessionStorage.getItem(positionKey)) || {};
    } catch {
      return {};
    }
  };

  const saveState = () => {
    try {
      window.sessionStorage.setItem(
        positionKey,
        JSON.stringify({ src: audio.src, time: audio.currentTime, playing: !audio.paused, rate: audio.playbackRate })
      );
    } catch {}
  };

  const render = () => {
    const playing = !audio.paused;
    playBtn.innerHTML = playing ? icons.pause : icons.play;
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    muteBtn.innerHTML = audio.muted ? icons.muted : icons.volume;
    muteBtn.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
    speedBtn.textContent = `${audio.playbackRate}x`;
    current.textContent = formatTime(audio.currentTime);
    duration.textContent = formatTime(audio.duration);
    if (!seeking && audio.duration) {
      progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    }
    progress.style.setProperty("--progress", `${(progress.value / 10).toFixed(1)}%`);
  };

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => player.classList.add("is-unavailable"));
    } else {
      audio.pause();
    }
  });

  player.querySelectorAll("[data-skip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = audio.currentTime + Number(btn.dataset.skip);
      audio.currentTime = Math.max(0, Math.min(target, audio.duration || target));
      render();
    });
  });

  speedBtn.addEventListener("click", () => {
    audio.playbackRate = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length];
    render();
    saveState();
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    render();
  });

  progress.addEventListener("input", () => {
    seeking = true;
    if (audio.duration) {
      current.textContent = formatTime((progress.value / 1000) * audio.duration);
    }
    progress.style.setProperty("--progress", `${(progress.value / 10).toFixed(1)}%`);
  });

  progress.addEventListener("change", () => {
    if (audio.duration) {
      audio.currentTime = (progress.value / 1000) * audio.duration;
    }
    seeking = false;
    render();
  });

  ["play", "pause", "timeupdate", "durationchange", "ratechange", "volumechange"].forEach((type) =>
    audio.addEventListener(type, render)
  );
  ["pause", "timeupdate"].forEach((type) => audio.addEventListener(type, saveState));
  audio.addEventListener("error", () => player.classList.add("is-unavailable"));
  audio.addEventListener("loadedmetadata", () => player.classList.remove("is-unavailable"));

  // Resume where the listener left off on the previous page.
  const saved = readState();
  if (saved.src === audio.src) {
    audio.addEventListener(
      "loadedmetadata",
      () => {
        audio.currentTime = saved.time || 0;
        audio.playbackRate = saved.rate || 1;
        if (saved.playing) {
          audio.play().catch(() => {});
        }
        render();
      },
      { once: true }
    );
  }
  window.addEventListener("pagehide", saveState);
  render();
})();

document.querySelectorAll("[data-copy-link]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyLink);
      button.textContent = "Link copied";
    } catch {
      button.textContent = button.dataset.copyLink;
    }
  });
});

// Footer glow: drifts on its own, eases toward the cursor on hover (desktop only, like acquired.fm).
if (
  document.documentElement.classList.contains("motion") &&
  window.matchMedia("(min-width: 767px) and (hover: hover) and (pointer: fine)").matches
) {
  document.querySelectorAll(".footer-cta").forEach((footer) => {
    const blob = document.createElement("span");
    blob.className = "footer-blob";
    blob.setAttribute("aria-hidden", "true");
    footer.prepend(blob);

    const radius = 400;
    let hovering = false;
    let mouseX = 0;
    let mouseY = 0;
    let x = Math.random() * footer.offsetWidth;
    let y = Math.random() * footer.offsetHeight;
    let vx = (Math.random() - 0.5) * 2;
    let vy = (Math.random() - 0.5) * 2;
    let frame = 0;
    let last = performance.now();

    footer.addEventListener("mouseenter", () => (hovering = true));
    footer.addEventListener("mouseleave", () => (hovering = false));
    footer.addEventListener("mousemove", (event) => {
      const rect = footer.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    });

    const tick = (now) => {
      const dt = (now - last) / 16.67;
      last = now;
      if (hovering) {
        x += (mouseX - x) * 0.1 * dt;
        y += (mouseY - y) * 0.1 * dt;
      } else {
        x += vx * dt;
        y += vy * dt;
        if (x <= 0 || x >= footer.offsetWidth) vx *= -1;
        if (y <= 0 || y >= footer.offsetHeight) vy *= -1;
      }
      blob.style.transform = `translate3d(${Math.round(x - radius)}px, ${Math.round(y - radius)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !frame) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
    }).observe(footer);
  });
}

// ---------------------------------------------------------------
// Interview extras
// ---------------------------------------------------------------
const motionOK = document.documentElement.classList.contains("motion");
const articlePage = document.querySelector(".article-page");
const articleBody = document.querySelector(".article-body");
const guestName = articlePage ? articlePage.dataset.guest || "" : "";

const track = (name, props) => {
  if (typeof window.plausible === "function") {
    window.plausible(name, props ? { props } : undefined);
  }
};

const toast = (() => {
  let el = null;
  let timer = 0;
  return (message) => {
    if (!el) {
      el = document.createElement("div");
      el.className = "ds-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("is-visible"));
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("is-visible"), 2200);
  };
})();

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
};

const pageUrl = () => window.location.origin + window.location.pathname;

const onceInView = (elements, callback, options = { threshold: 0.2 }) => {
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => callback(el, 0));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => {
        observer.unobserve(entry.target);
        callback(entry.target, index);
      });
  }, options);
  elements.forEach((el) => observer.observe(el));
};

// Every question gets a "#" button that copies a link straight to it.
if (articleBody) {
  const questions = articleBody.querySelectorAll("h2[id]");
  questions.forEach((heading) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "q-anchor";
    button.textContent = "#";
    button.setAttribute("aria-label", "Copy a link to this question");
    button.title = "Copy a link to this question";
    heading.appendChild(button);
    button.addEventListener("click", async () => {
      const url = `${pageUrl()}#${heading.id}`;
      history.replaceState(null, "", `#${heading.id}`);
      if (await copyText(url)) {
        toast("Link to this question copied");
        button.classList.add("is-copied");
        setTimeout(() => button.classList.remove("is-copied"), 1600);
      }
      track("Question link", { question: heading.id });
    });
  });

  const flashTarget = (id = decodeURIComponent(window.location.hash.slice(1))) => {
    const heading = id && document.getElementById(id);
    if (heading && heading.tagName === "H2") {
      heading.classList.remove("is-target");
      void heading.offsetWidth;
      heading.classList.add("is-target");
    }
  };
  window.addEventListener("hashchange", () => flashTarget());
  window.addEventListener("load", () => flashTarget());
  // In-page links scroll smoothly (see above) without a hashchange: flash once they arrive.
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) setTimeout(() => flashTarget(decodeURIComponent(link.hash.slice(1))), prefersReducedMotion ? 0 : 1400);
  });
}

// Pull quote: words rise in one after another.
document.querySelectorAll(".pull-quote blockquote p").forEach((p) => {
  const words = p.textContent.trim().split(/\s+/);
  p.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "qw";
    span.style.setProperty("--w", index);
    span.textContent = word;
    p.append(span, index < words.length - 1 ? " " : "");
  });
});
onceInView(document.querySelectorAll(".pull-quote"), (el) => el.classList.add("is-in"), { threshold: 0.3 });

// Place photos open up when they enter, then drift slightly with the scroll.
const places = document.querySelectorAll(".place-card");
onceInView(places, (el) => el.classList.add("is-in"), { threshold: 0.25 });
if (motionOK && places.length) {
  let ticking = false;
  const parallax = () => {
    ticking = false;
    const vh = window.innerHeight;
    places.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) {
        return;
      }
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      card.style.setProperty("--p", Math.max(-1, Math.min(1, progress)).toFixed(3));
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }
    },
    { passive: true }
  );
  parallax();
}

// Project cards: a soft glow follows the pointer.
document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

// ---------------------------------------------------------------
// Listen: the recorded interview (assets/audio/<slug>.mp3), following the text
// paragraph by paragraph. Interviews without a recording get no player.
// ---------------------------------------------------------------
const reader = (() => {
  if (!articleBody || !articlePage.dataset.guest || !("speechSynthesis" in window)) {
    return null;
  }
  // Still playing from a previous page: that player stays (see "Keep the audio playing").
  if (document.querySelector(".audio-player")) {
    return null;
  }
  const synth = window.speechSynthesis;
  const CHARS_PER_SECOND = 15;
  const speeds = [1, 1.25, 1.5, 2];
  const storageKey = `databasestory-reader:${window.location.pathname}`;
  const guestVoice = articlePage.dataset.voice === "female" ? "female" : "male";
  const hostVoice = guestVoice === "female" ? "male" : "female";

  const female = /\b(ava|emma|jenny|aria|michelle|sonia|libby|natasha|clara|samantha|allison|susan|victoria|karen|moira|serena|tessa|fiona|zoe|kate|joanna|salli|kimberly|ivy|kendra|nicky|martha|catherine|hazel|zira|veena|ana|jane|molly|elsa|isabella|maisie|olivia|amy|emily|female|woman)\b/i;
  const male = /\b(andrew|brian|guy|christopher|eric|roger|steffan|ryan|thomas|alex|daniel|tom|aaron|evan|nathan|oliver|arthur|gordon|lee|matthew|justin|joey|david|mark|george|james|rishi|william|liam|noah|male|man)\b/i;
  // Novelty and robotic legacy voices (macOS Eloquence and friends) never sound natural.
  const novelty = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|junior|eddy|flo|reed|rocko|sandy|shelley|fred|ralph|kathy)\b/i;

  const genderOf = (voice) => {
    if (/google uk english male/i.test(voice.name)) return "male";
    if (/google (us|uk) english( female)?$/i.test(voice.name)) return "female";
    if (female.test(voice.name)) return "female";
    if (male.test(voice.name)) return "male";
    return "";
  };

  const quality = (voice) => {
    let score = 0;
    if (/natural|neural/i.test(voice.name)) score += 100;
    if (/premium/i.test(voice.name)) score += 80;
    if (/enhanced/i.test(voice.name)) score += 60;
    if (/^google/i.test(voice.name)) score += 50;
    if (/online/i.test(voice.name)) score += 30;
    if (/^en-US/i.test(voice.lang)) score += 8;
    else if (/^en-GB/i.test(voice.lang)) score += 6;
    else if (/^en/i.test(voice.lang)) score += 3;
    return score;
  };

  const pickVoice = (gender, avoid) => {
    const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang) && !novelty.test(v.name));
    const ranked = voices
      .map((v) => ({ v, score: quality(v) + (genderOf(v) === gender ? 200 : genderOf(v) ? -200 : 0) - (v === avoid ? 500 : 0) }))
      .sort((a, b) => b.score - a.score);
    return ranked.length ? ranked[0].v : null;
  };

  // Segments: the title, then every question and answer, until the links section.
  const segments = [];
  const header = document.querySelector(".article-header h1");
  if (header) {
    segments.push({ el: header, role: "host", text: `Interview with ${guestName || header.textContent.trim()}, on DatabaseStory.` });
  }
  const stopAt = /^(where-can-people-find|links$|can-people-contact|whats-the-best-way-to-reach)/;
  for (const el of articleBody.querySelectorAll(":scope > h2, :scope > p, :scope > blockquote, :scope > ul > li, :scope > ol > li")) {
    if (el.tagName === "H2" && stopAt.test(el.id)) break;
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".q-anchor").forEach((n) => n.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (text.length > 1) {
      segments.push({ el, role: el.tagName === "H2" ? "host" : "guest", text });
    }
  }

  const splitSentences = (text) => {
    const out = [];
    text.split(/(?<=[.!?…:;])\s+/).forEach((sentence) => {
      if (sentence.length <= 220) {
        out.push(sentence);
        return;
      }
      let buffer = "";
      sentence.split(/(?<=,)\s+/).forEach((part) => {
        if ((buffer + " " + part).length > 220 && buffer) {
          out.push(buffer);
          buffer = part;
        } else {
          buffer = buffer ? `${buffer} ${part}` : part;
        }
      });
      if (buffer) out.push(buffer);
    });
    // Merge very short sentences so the voice keeps its flow.
    return out.reduce((acc, s) => {
      if (acc.length && (acc[acc.length - 1].length < 60 || s.length < 20) && acc[acc.length - 1].length + s.length < 220) {
        acc[acc.length - 1] += ` ${s}`;
      } else {
        acc.push(s);
      }
      return acc;
    }, []);
  };

  const chunks = [];
  segments.forEach((segment, segIndex) => {
    splitSentences(segment.text).forEach((text) => {
      chunks.push({ text, segIndex, role: segment.role, offset: 0 });
    });
  });
  let total = 0;
  chunks.forEach((chunk) => {
    chunk.offset = total;
    total += chunk.text.length + 1;
  });
  if (!chunks.length) {
    return null;
  }

  const state = { index: 0, playing: false, rate: 1, token: 0, follow: true, lastUserScroll: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    if (Number.isInteger(saved.index) && saved.index < chunks.length - 1) state.index = saved.index;
    if (speeds.includes(saved.rate)) state.rate = saved.rate;
  } catch {}

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ index: state.index, rate: state.rate }));
    } catch {}
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.round(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${String(m).padStart(2, "0")}:${s}`;
  };
  const secondsAt = (chars) => chars / (CHARS_PER_SECOND * state.rate);

  const icons = {
    prev: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5.5v13a.8.8 0 0 1-1.2.7L9.6 12.7a.8.8 0 0 1 0-1.4l9.2-6.5a.8.8 0 0 1 1.2.7Z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5.5v13a.8.8 0 0 0 1.2.7l9.2-6.5a.8.8 0 0 0 0-1.4L5.2 4.8A.8.8 0 0 0 4 5.5Z"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1"/><rect x="13.5" y="4" width="4.5" height="16" rx="1"/></svg>',
  };

  const player = document.createElement("div");
  player.className = "audio-player is-reader";
  player.setAttribute("role", "region");
  player.setAttribute("aria-label", "Read this interview aloud");
  player.innerHTML = `
    <div class="audio-inner">
      <div class="audio-controls">
        <button class="audio-btn" type="button" data-step="-1" aria-label="Previous paragraph">${icons.prev}</button>
        <button class="audio-btn audio-play" type="button" aria-label="Listen">${icons.play}</button>
        <button class="audio-btn" type="button" data-step="1" aria-label="Next paragraph">${icons.next}</button>
      </div>
      <div class="audio-main">
        <span class="audio-title">Listen: ${guestName ? `Interview with ${guestName}` : document.title}</span>
        <input class="audio-progress" type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the interview" />
        <div class="audio-times"><span class="audio-current">00:00</span><span class="audio-voice"></span><span class="audio-duration">--:--</span></div>
      </div>
      <div class="audio-extra">
        <button class="audio-speed" type="button" aria-label="Reading speed">1x</button>
      </div>
    </div>`;
  // Shown once the recording is found (see the fetch at the end).
  player.hidden = true;
  document.body.appendChild(player);

  const playBtn = player.querySelector(".audio-play");
  const speedBtn = player.querySelector(".audio-speed");
  const progress = player.querySelector(".audio-progress");
  const current = player.querySelector(".audio-current");
  const duration = player.querySelector(".audio-duration");
  const voiceLabel = player.querySelector(".audio-voice");
  const listenBtn = document.querySelector("[data-listen]");
  let seeking = false;
  let speakingEl = null;
  let voices = { guest: null, host: null };

  const loadVoices = () => {
    voices.guest = pickVoice(guestVoice);
    voices.host = pickVoice(hostVoice, voices.guest) || voices.guest;
    if (voices.guest) {
      voiceLabel.textContent = voices.guest.name.replace(/^Microsoft\s+/i, "").replace(/\s*-\s*English.*$/i, "");
      voiceLabel.title = `Guest voice: ${voices.guest.name}`;
    }
  };
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);

  // The recording, plus the start time of every paragraph (assets/audio/<slug>.json).
  let rec = null;
  const segAt = (time) => {
    let index = 0;
    rec.meta.segments.forEach((seg, i) => {
      if (seg.t <= time + 0.05) index = i;
    });
    return Math.min(index, segments.length - 1);
  };
  const currentSeg = () => (rec ? segAt(rec.audio.currentTime) : chunks[state.index].segIndex);

  const render = () => {
    const chunk = chunks[state.index];
    const now = rec ? rec.audio.currentTime / state.rate : secondsAt(chunk.offset);
    const end = rec ? rec.meta.duration / state.rate : secondsAt(total);
    playBtn.innerHTML = state.playing ? icons.pause : icons.play;
    playBtn.setAttribute("aria-label", state.playing ? "Pause" : "Listen");
    speedBtn.textContent = `${state.rate}x`;
    current.textContent = formatTime(now);
    duration.textContent = formatTime(end);
    if (!seeking) {
      progress.value = String(Math.round((now / end) * 1000));
    }
    progress.style.setProperty("--progress", `${(progress.value / 10).toFixed(1)}%`);
    if (listenBtn) {
      const started = rec ? now > 1 : state.index > 0;
      listenBtn.classList.toggle("is-playing", state.playing);
      listenBtn.querySelector(".listen-label").textContent = state.playing ? "Pause" : started ? "Resume listening" : "Listen to this interview";
      listenBtn.querySelector(".listen-time").textContent = `${Math.max(1, Math.round((end - now) / 60))} min`;
    }
  };

  const highlight = () => {
    const el = segments[currentSeg()].el;
    if (el === speakingEl) return;
    speakingEl?.classList.remove("is-speaking");
    speakingEl = state.playing ? el : null;
    if (!speakingEl) return;
    speakingEl.classList.add("is-speaking");
    const rect = speakingEl.getBoundingClientRect();
    const userScrolledRecently = performance.now() - state.lastUserScroll < 5000;
    if (!userScrolledRecently && (rect.top < 80 || rect.bottom > window.innerHeight - 140)) {
      speakingEl.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "center" });
    }
  };

  const speak = () => {
    const token = ++state.token;
    synth.cancel();
    const chunk = chunks[state.index];
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    const voice = chunk.role === "host" ? voices.host : voices.guest;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = state.rate;
    utterance.onend = () => {
      if (token !== state.token || !state.playing) return;
      if (state.index >= chunks.length - 1) {
        state.playing = false;
        state.index = 0;
        highlight();
        render();
        save();
        return;
      }
      state.index += 1;
      save();
      render();
      highlight();
      // A short breath between a question and its answer.
      const pause = chunks[state.index].segIndex !== chunk.segIndex ? 350 : 0;
      setTimeout(() => token === state.token && state.playing && speak(), pause);
    };
    utterance.onerror = (event) => {
      if (token !== state.token || event.error === "interrupted" || event.error === "canceled") return;
      state.playing = false;
      render();
    };
    // Chrome may drop a cancel issued right before speak; queue on the next tick.
    setTimeout(() => token === state.token && synth.speak(utterance), 30);
  };

  const play = () => {
    if (!rec) return;
    if (rec) {
      rec.audio.playbackRate = state.rate;
      rec.audio.play().catch(() => {});
      track("Read aloud", { guest: guestName, voice: "recorded" });
      return;
    }
    if (!voices.guest) loadVoices();
    state.playing = true;
    render();
    highlight();
    speak();
    track("Read aloud", { guest: guestName });
  };

  const pause = () => {
    if (rec) {
      rec.audio.pause();
      return;
    }
    state.playing = false;
    state.token += 1;
    synth.cancel();
    highlight();
    render();
    save();
  };

  const jumpTo = (index) => {
    state.index = Math.max(0, Math.min(chunks.length - 1, index));
    save();
    render();
    if (state.playing) {
      highlight();
      speak();
    }
  };

  const toggle = () => (state.playing ? pause() : play());

  playBtn.addEventListener("click", toggle);
  listenBtn?.addEventListener("click", toggle);

  player.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step);
      if (rec) {
        const starts = rec.meta.segments;
        const i = segAt(rec.audio.currentTime);
        const back = rec.audio.currentTime - starts[i].t > 2 ? i : i - 1;
        rec.audio.currentTime = starts[Math.max(0, Math.min(starts.length - 1, step > 0 ? i + 1 : back))].t;
        return;
      }
      const seg = chunks[state.index].segIndex;
      let target;
      if (step > 0) {
        target = chunks.findIndex((c) => c.segIndex > seg);
      } else {
        const startOfSeg = chunks.findIndex((c) => c.segIndex === seg);
        const prevSeg = state.index > startOfSeg ? seg : seg - 1;
        target = chunks.findIndex((c) => c.segIndex === prevSeg);
      }
      if (target >= 0) jumpTo(target);
    });
  });

  speedBtn.addEventListener("click", () => {
    state.rate = speeds[(speeds.indexOf(state.rate) + 1) % speeds.length];
    save();
    if (rec) rec.audio.playbackRate = state.rate;
    render();
    if (state.playing && !rec) speak();
  });

  progress.addEventListener("input", () => {
    seeking = true;
    const end = rec ? rec.meta.duration / state.rate : secondsAt(total);
    current.textContent = formatTime((progress.value / 1000) * end);
    progress.style.setProperty("--progress", `${(progress.value / 10).toFixed(1)}%`);
  });

  progress.addEventListener("change", () => {
    seeking = false;
    if (rec) {
      rec.audio.currentTime = (progress.value / 1000) * rec.meta.duration;
      return;
    }
    const chars = (progress.value / 1000) * total;
    let index = chunks.findIndex((c) => c.offset > chars) - 1;
    if (index < 0) index = chars > 0 ? chunks.length - 1 : 0;
    jumpTo(index);
  });

  ["wheel", "touchmove", "keydown"].forEach((type) =>
    window.addEventListener(type, () => (state.lastUserScroll = performance.now()), { passive: true })
  );
  window.addEventListener("pagehide", () => synth.cancel());

  // Start reading from a given element (used by the selection menu).
  const startFrom = (el) => {
    if (!rec) return;
    const segIndex = segments.findIndex((s) => s.el === el || s.el.contains(el) || el.contains(s.el));
    if (segIndex < 0) return;
    if (rec) {
      const seg = rec.meta.segments[segIndex];
      if (!seg) return;
      rec.audio.currentTime = seg.t;
      play();
      return;
    }
    state.index = chunks.findIndex((c) => c.segIndex === segIndex);
    play();
  };

  window.__dsAudioPlaying = () => (rec ? !rec.audio.paused : state.playing);

  const slug = window.location.pathname.split("/").pop().replace(/\.html$/, "");
  const audioBase = new URL(`../assets/audio/${slug}`, window.location.href);
  fetch(`${audioBase}.json`)
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .then((meta) => {
      const audio = new Audio(`${audioBase}.mp3`);
      audio.preload = "metadata";
      rec = { audio, meta };
      player.hidden = false;
      document.body.classList.add("has-audio-player");
      listenBtn?.removeAttribute("hidden");
      synth.cancel();
      state.playing = false;
      voiceLabel.textContent = "";
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
        if (saved.time > 0 && saved.time < meta.duration - 5) audio.currentTime = saved.time;
      } catch {}
      const sync = () => {
        state.playing = !audio.paused;
        render();
        highlight();
      };
      ["play", "pause", "timeupdate", "seeked", "ended", "loadedmetadata"].forEach((type) => audio.addEventListener(type, sync));
      audio.addEventListener("ended", () => (audio.currentTime = 0));
      audio.addEventListener("pause", () => {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ rate: state.rate, time: audio.currentTime }));
        } catch {}
      });
      render();
    })
    .catch(() => player.remove());

  render();
  return { startFrom, hasAudio: () => Boolean(rec) };
})();

// ---------------------------------------------------------------
// Highlight to share: select a sentence, share it with a link that
// scrolls straight to it (URL text fragments).
// ---------------------------------------------------------------
if (articleBody) {
  const pop = document.createElement("div");
  pop.className = "sel-pop";
  pop.setAttribute("role", "toolbar");
  pop.setAttribute("aria-label", "Share this quote");
  pop.innerHTML = `
    <button type="button" data-act="x"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>Post</button>
    <button type="button" data-act="linkedin"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h18v18H3V3Zm4.34 15.34V9.75H4.67v8.59h2.67ZM6 8.58a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm12.34 9.76v-4.71c0-2.31-.5-4.09-3.2-4.09a2.8 2.8 0 0 0-2.52 1.39h-.04V9.75h-2.56v8.59h2.67v-4.25c0-1.12.21-2.2 1.6-2.2 1.37 0 1.39 1.28 1.39 2.27v4.18h2.66Z"/></svg>Share</button>
    <button type="button" data-act="copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>Copy</button>
    ${reader ? '<button type="button" data-act="listen"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>Listen</button>' : ""}`;
  document.body.appendChild(pop);

  let current = null;

  const fragmentLink = (text) => {
    const enc = (s) => encodeURIComponent(s).replace(/-/g, "%2D").replace(/,/g, "%2C").replace(/&/g, "%26");
    const words = text.split(/\s+/);
    const directive = words.length <= 8 ? enc(text) : `${enc(words.slice(0, 4).join(" "))},${enc(words.slice(-4).join(" "))}`;
    return `${pageUrl()}#:~:text=${directive}`;
  };

  const hide = () => {
    pop.classList.remove("is-visible");
    current = null;
  };

  const show = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      hide();
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const host = container.nodeType === 1 ? container : container.parentElement;
    if (!articleBody.contains(host) || host.closest(".place-card, .project-row, .shelf-card")) {
      hide();
      return;
    }
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (text.split(" ").length < 3 || text.length > 900) {
      hide();
      return;
    }
    const rect = range.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 160, Math.max(160, rect.left + rect.width / 2));
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${rect.top + window.scrollY}px`;
    current = { text, el: host.closest("p, li, blockquote, h2") || host };
    const listenAct = pop.querySelector('[data-act="listen"]');
    if (listenAct) listenAct.hidden = !reader.hasAudio();
    pop.classList.add("is-visible");
  };

  document.addEventListener("mouseup", (event) => {
    if (!pop.contains(event.target)) setTimeout(show, 10);
  });
  document.addEventListener("keyup", (event) => {
    if (event.shiftKey) show();
  });
  let touchTimer = 0;
  document.addEventListener("selectionchange", () => {
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
      if (window.getSelection().isCollapsed) hide();
      else if (matchMedia("(pointer: coarse)").matches) show();
    }, 350);
  });
  document.addEventListener("mousedown", (event) => {
    if (!pop.contains(event.target)) hide();
  });
  pop.addEventListener("mousedown", (event) => event.preventDefault());

  pop.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !current) return;
    const { text, el } = current;
    const link = fragmentLink(text);
    const short = text.length > 200 ? `${text.slice(0, 197).replace(/\s+\S*$/, "")}…` : text;
    const signature = guestName ? ` — ${guestName}` : "";
    const act = button.dataset.act;
    if (act === "x") {
      window.open(`https://x.com/intent/post?text=${encodeURIComponent(`“${short}”${signature} on @DatabaseStory`)}&url=${encodeURIComponent(link)}`, "_blank", "noopener,width=600,height=520");
    } else if (act === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, "_blank", "noopener,width=600,height=620");
    } else if (act === "copy") {
      if (await copyText(`“${text}”${signature}, DatabaseStory\n${link}`)) toast("Quote and link copied");
    } else if (act === "listen" && reader) {
      reader.startFrom(el);
    }
    track("Quote share", { action: act, guest: guestName });
    window.getSelection().removeAllRanges();
    hide();
  });
}

// ---------------------------------------------------------------
// Library
// ---------------------------------------------------------------
(() => {
  const shelf = document.querySelector(".bookshelf");
  if (!shelf) return;
  const books = [...shelf.querySelectorAll(".book")];
  const chips = [...document.querySelectorAll(".chip")];
  const guestButtons = [...document.querySelectorAll(".shelf-guest")];
  const guestGroup = document.querySelector(".shelf-guests");
  const resources = [...document.querySelectorAll(".resource")];
  const empty = document.querySelector(".shelf-empty");
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    document.documentElement.style.setProperty("--topbar-h", `${topbar.offsetHeight}px`);
  }

  // Books land on the shelf, row after row.
  books.forEach((book, index) => (book.style.viewTransitionName = `book-${index}`));
  const land = (els) => {
    els.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    els.forEach((el, i) => {
      el.style.setProperty("--d", `${Math.min(i, 10) * 70}ms`);
      el.classList.add("is-in");
    });
  };
  if (motionOK && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        visible.forEach((el) => io.unobserve(el));
        if (visible.length) land(visible);
      },
      { threshold: 0.15 }
    );
    books.forEach((book) => io.observe(book));
  } else {
    books.forEach((book) => book.classList.add("is-in"));
  }
  onceInView(document.querySelectorAll(".resource, .nonreader"), (el) => el.classList.add("is-in"), { threshold: 0.15 });

  // Tilt and shine follow the pointer.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    shelf.querySelectorAll(".book-open").forEach((button) => {
      const book = button.querySelector(".book-3d");
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        book.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
        book.style.setProperty("--rx", `${(-y * 12).toFixed(2)}deg`);
        book.style.setProperty("--shine", `${Math.round((x + 0.5) * 100)}%`);
      });
      button.addEventListener("pointerleave", () => {
        book.style.setProperty("--ry", "0deg");
        book.style.setProperty("--rx", "0deg");
      });
    });
  }

  // Filters: one topic and one guest at a time.
  const params = new URLSearchParams(window.location.search);
  const filter = { cat: "all", guest: params.get("guest") || "" };

  const apply = () => {
    let shown = 0;
    books.forEach((book) => {
      const ok = (filter.cat === "all" || book.dataset.cat === filter.cat) && (!filter.guest || book.dataset.guests.split(" ").includes(filter.guest));
      book.classList.toggle("is-hidden", !ok);
      if (ok) {
        shown += 1;
        book.classList.add("is-in");
      }
    });
    resources.forEach((r) => {
      r.hidden = Boolean(filter.guest) && !r.dataset.guests.split(" ").includes(filter.guest);
    });
    empty.hidden = shown > 0;
    chips.forEach((chip) => {
      const on = chip.dataset.filter === filter.cat;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", String(on));
    });
    guestButtons.forEach((btn) => {
      const on = btn.dataset.guest === filter.guest;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    guestGroup?.classList.toggle("has-active", Boolean(filter.guest));
    const url = new URL(window.location.href);
    if (filter.guest) url.searchParams.set("guest", filter.guest);
    else url.searchParams.delete("guest");
    history.replaceState(null, "", url);
  };

  const update = (change) => {
    Object.assign(filter, change);
    if (motionOK && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  };

  chips.forEach((chip) => chip.addEventListener("click", () => update({ cat: chip.dataset.filter })));
  guestButtons.forEach((btn) =>
    btn.addEventListener("click", () => update({ guest: filter.guest === btn.dataset.guest ? "" : btn.dataset.guest }))
  );
  if (filter.guest) apply();

  // Dialog: the book comes forward and its cover swings open on the guest's words.
  const dialog = document.querySelector(".book-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const $ = (sel) => dialog.querySelector(sel);
  let lastTrigger = null;

  const openBook = (button) => {
    const d = button.dataset;
    const picks = JSON.parse(d.picks);
    lastTrigger = button;
    $(".book-big-cover img").src = d.cover;
    $(".book-big").style.setProperty("--ar", d.ar);
    $(".book-dialog-cat").textContent = `${d.catLabel} · ${d.year}`;
    $(".book-dialog-title").textContent = d.title;
    $(".book-dialog-author").textContent = d.author;
    $(".book-dialog-note").textContent = d.note || "";
    const list = $(".book-dialog-picks");
    list.innerHTML = "";
    picks.forEach((pick) => {
      const row = document.createElement("div");
      row.className = "book-pick";
      row.innerHTML = `<img src="./assets/faces/${pick.guest}.jpg" alt="" /><span class="book-pick-name"></span><span class="book-pick-role"></span><blockquote class="book-pick-quote"></blockquote><a></a>`;
      row.querySelector(".book-pick-name").textContent = pick.name;
      row.querySelector(".book-pick-role").textContent = pick.role;
      row.querySelector(".book-pick-quote").textContent = `“${pick.quote}”`;
      const a = row.querySelector("a");
      a.href = pick.href;
      a.textContent = `Read ${pick.name.split(" ")[0]}’s answer →`;
      list.appendChild(row);
    });
    const link = $(".book-dialog-link");
    link.hidden = !d.link;
    if (d.link) link.href = d.link;

    dialog.classList.remove("is-closing");
    // A fresh copy restarts the text animation for each book.
    const text = $(".book-dialog-text");
    text.replaceWith(text.cloneNode(true));
    dialog.showModal();
    history.replaceState(null, "", `#${button.closest(".book").id}`);
    track("Book opened", { book: button.closest(".book").id });
  };

  const closeBook = () => {
    const done = () => {
      dialog.classList.remove("is-closing");
      dialog.close();
      lastTrigger?.focus({ preventScroll: true });
    };
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!motionOK) {
      done();
      return;
    }
    dialog.classList.add("is-closing");
    setTimeout(done, 320);
  };

  shelf.addEventListener("click", (event) => {
    const button = event.target.closest(".book-open");
    if (button) openBook(button);
  });
  $(".book-dialog-close").addEventListener("click", closeBook);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeBook();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeBook();
  });

  const fromHash = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (fromHash && fromHash.classList.contains("book")) {
    fromHash.scrollIntoView({ block: "center" });
    setTimeout(() => openBook(fromHash.querySelector(".book-open")), 500);
  }
})();

// ---------------------------------------------------------------
// Keep the audio playing across pages: while something plays, internal
// links swap the page content in place instead of reloading, so the
// player at the bottom (and its audio) stays alive. When nothing plays,
// links navigate normally.
// ---------------------------------------------------------------
if (!window.__dsNav) {
  window.__dsNav = true;
  const scriptUrl = document.currentScript && document.currentScript.src;
  const persistent = ".audio-player, .ds-toast";
  let pagePath = window.location.pathname;
  let siteCode = null;

  const isPlaying = () => typeof window.__dsAudioPlaying === "function" && window.__dsAudioPlaying();
  const isPage = (url) => url.origin === window.location.origin && /(\.html|\/)$/.test(url.pathname);

  const swap = async (url, push) => {
    let doc;
    try {
      const response = await fetch(url.href, { credentials: "same-origin" });
      if (!response.ok) throw new Error(response.status);
      doc = new DOMParser().parseFromString(await response.text(), "text/html");
      siteCode = siteCode || (await (await fetch(scriptUrl)).text());
    } catch {
      window.location.href = url.href;
      return;
    }
    const anchor = document.querySelector(".audio-player");
    [...document.body.children].forEach((el) => {
      if (!el.matches(persistent)) el.remove();
    });
    [...doc.body.children].forEach((el) => {
      if (el.tagName !== "SCRIPT") document.body.insertBefore(document.adoptNode(el), anchor);
    });
    document.title = doc.title;
    document.documentElement.classList.remove("menu-open");
    if (push) history.pushState(null, "", url.href);
    pagePath = window.location.pathname;
    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    // Run the page setup again for the new content (players already alive are left as they are).
    try {
      new Function(siteCode)();
    } catch (error) {
      console.error(error);
    }
    if (typeof window.plausible === "function") window.plausible("pageview");
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target || link.hasAttribute("download")) return;
    const url = new URL(link.href, window.location.href);
    if (!isPage(url) || url.pathname === window.location.pathname || !isPlaying()) return;
    event.preventDefault();
    swap(url, true);
  });

  window.addEventListener("popstate", () => {
    if (window.location.pathname === pagePath) return; // only the hash changed
    if (isPlaying()) swap(new URL(window.location.href), false);
    else window.location.reload();
  });
}
