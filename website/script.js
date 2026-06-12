const DATA_PATHS = {
  folders: "data/folders.json",
  files: "data/files.json",
  websites: "data/websites.json",
  all: "data/all_resources.json",
};

const labels = {
  folder: "Dossier",
  file: "Fichier",
  website: "Site web",
};

const icons = {
  folder: "📁",
  file: "📄",
  website: "🌐",
};

let revealObserver;

document.addEventListener("DOMContentLoaded", () => {
  setupVisualEffects();
  setupNavbar();
  setupFooterYear();

  const page = document.body.dataset.page;

  if (page === "home") loadHomeStats();
  if (page === "resources") loadResourcesPage();
  if (page === "websites") loadWebsitesPage();

  prepareReveals();
  setupTiltEffects();
  setupMagneticButtons();
});

function setupVisualEffects() {
  if (!document.querySelector(".scroll-progress")) {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.prepend(progress);
  }

  if (!document.querySelector(".ambient")) {
    const ambient = document.createElement("div");
    ambient.className = "ambient";
    ambient.setAttribute("aria-hidden", "true");
    ambient.innerHTML = "<span></span><span></span><span></span><span></span>";
    document.body.prepend(ambient);
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor-glow";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    window.addEventListener("pointermove", (event) => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    }, { passive: true });
  }

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max <= 0 ? 0 : (window.scrollY / max) * 100;
    document.documentElement.style.setProperty("--scroll", `${value}%`);
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
}

function setupNavbar() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#navLinks");

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }
  });
}

function setupFooterYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Impossible de charger ${path}`);
  return response.json();
}

async function loadHomeStats() {
  try {
    const [folders, files, websites] = await Promise.all([
      fetchJson(DATA_PATHS.folders),
      fetchJson(DATA_PATHS.files),
      fetchJson(DATA_PATHS.websites),
    ]);

    animateNumber("#homeFolders", folders.length);
    animateNumber("#homeFiles", files.length);
    animateNumber("#homeWebsites", websites.length);
  } catch (error) {
    console.error(error);
  }
}

async function loadResourcesPage() {
  const grid = document.querySelector("#resourcesGrid");
  const count = document.querySelector("#resourceCount");
  const empty = document.querySelector("#resourcesEmpty");
  const searchInput = document.querySelector("#resourceSearch");
  const typeFilter = document.querySelector("#typeFilter");
  const ownerFilter = document.querySelector("#ownerFilter");
  const resetButton = document.querySelector("#resetFilters");

  if (!grid || !count || !empty || !searchInput || !typeFilter || !ownerFilter || !resetButton) return;

  try {
    const [folders, files] = await Promise.all([
      fetchJson(DATA_PATHS.folders),
      fetchJson(DATA_PATHS.files),
    ]);

    const resources = [
      ...folders.map((item) => ({ ...item, type: "folder" })),
      ...files.map((item) => ({ ...item, type: "file" })),
    ];

    fillOwnerFilter(resources, ownerFilter);

    const render = () => {
      const query = normalize(searchInput.value);
      const selectedType = typeFilter.value;
      const selectedOwner = ownerFilter.value;

      const filtered = resources.filter((item) => {
        const matchesQuery = [item.name, item.description, item.owner]
          .map(normalize)
          .some((value) => value.includes(query));

        const matchesType = selectedType === "all" || item.type === selectedType;
        const matchesOwner = selectedOwner === "all" || item.owner === selectedOwner;

        return matchesQuery && matchesType && matchesOwner;
      });

      renderCards(grid, filtered);
      count.textContent = `${filtered.length} ressource(s) affichée(s) sur ${resources.length}`;
      empty.classList.toggle("hidden", filtered.length !== 0);
      refreshDynamicElements(grid);
    };

    [searchInput, typeFilter, ownerFilter].forEach((element) => {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    });

    resetButton.addEventListener("click", () => {
      searchInput.value = "";
      typeFilter.value = "all";
      ownerFilter.value = "all";
      render();
    });

    render();
  } catch (error) {
    console.error(error);
    count.textContent = "Erreur de chargement des ressources.";
  }
}

async function loadWebsitesPage() {
  const grid = document.querySelector("#websitesGrid");
  const count = document.querySelector("#websiteCount");
  const empty = document.querySelector("#websitesEmpty");
  const searchInput = document.querySelector("#websiteSearch");

  if (!grid || !count || !empty || !searchInput) return;

  try {
    const websites = await fetchJson(DATA_PATHS.websites);
    const resources = websites.map((item) => ({ ...item, type: "website" }));

    const render = () => {
      const query = normalize(searchInput.value);

      const filtered = resources.filter((item) => {
        return [item.name, item.description, item.link]
          .map(normalize)
          .some((value) => value.includes(query));
      });

      renderCards(grid, filtered);
      count.textContent = `${filtered.length} site(s) affiché(s) sur ${resources.length}`;
      empty.classList.toggle("hidden", filtered.length !== 0);
      refreshDynamicElements(grid);
    };

    searchInput.addEventListener("input", render);
    render();
  } catch (error) {
    console.error(error);
    count.textContent = "Erreur de chargement des sites web.";
  }
}

function fillOwnerFilter(resources, select) {
  const owners = Array.from(
    new Set(resources.map((item) => item.owner).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "fr"));

  owners.forEach((owner) => {
    const option = document.createElement("option");
    option.value = owner;
    option.textContent = owner;
    select.appendChild(option);
  });
}

function renderCards(container, items) {
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = `resource-card resource-card-${item.type || "default"} reveal`;
    card.style.setProperty("--reveal-delay", `${Math.min(index, 9) * 45}ms`);

    const typeLabel = labels[item.type] || "Ressource";
    const icon = icons[item.type] || "🔗";
    const owner = item.owner ? `<div class="meta">Propriétaire : ${escapeHtml(item.owner)}</div>` : "";

    card.innerHTML = `
      <div class="card-top">
        <span class="badge badge-${escapeAttribute(item.type || "default")}">${icon} ${typeLabel}</span>
      </div>
      <h2>${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(item.description)}</p>
      ${owner}
      <div class="card-actions">
        <a class="btn btn-primary" href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">
          Ouvrir la ressource
        </a>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function prepareReveals(scope = document) {
  const elements = scope.querySelectorAll(
    ".hero-copy, .hero-panel, .section-heading, .feature-card, .cta-card, .toolbar, .results-summary, .download-card, .content-card, .empty-state, .page-hero .container"
  );

  elements.forEach((element, index) => {
    if (!element.classList.contains("reveal")) element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 55}ms`);
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -70px 0px" });
  }

  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));
}

function setupTiltEffects(scope = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cards = scope.querySelectorAll(".feature-card, .resource-card, .download-card, .content-card, .cta-card, .hero-panel");

  cards.forEach((card) => {
    if (card.dataset.tiltReady === "true") return;
    card.dataset.tiltReady = "true";

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
      card.style.setProperty("--rx", `${y * 4}deg`);
      card.style.setProperty("--ry", `${x * 5}deg`);
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

function setupMagneticButtons(scope = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  scope.querySelectorAll(".btn").forEach((button) => {
    if (button.dataset.magneticReady === "true") return;
    button.dataset.magneticReady = "true";

    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
      button.style.transform = `translate(${x}px, ${y}px) translateY(-3px)`;
    }, { passive: true });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

function refreshDynamicElements(scope) {
  prepareReveals(scope);
  setupTiltEffects(scope);
  setupMagneticButtons(scope);
}

function animateNumber(selector, target) {
  const element = document.querySelector(selector);
  if (!element) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target;
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
