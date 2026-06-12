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

document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  setupFooterYear();

  const page = document.body.dataset.page;

  if (page === "home") loadHomeStats();
  if (page === "resources") loadResourcesPage();
  if (page === "websites") loadWebsitesPage();
});

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

    setText("#homeFolders", folders.length);
    setText("#homeFiles", files.length);
    setText("#homeWebsites", websites.length);
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

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "resource-card";

    const typeLabel = labels[item.type] || "Ressource";
    const icon = icons[item.type] || "🔗";
    const owner = item.owner ? `<div class="meta">Propriétaire : ${escapeHtml(item.owner)}</div>` : "";

    card.innerHTML = `
      <div class="card-top">
        <span class="badge">${icon} ${typeLabel}</span>
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

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
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
