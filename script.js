/* =========================================================
   Aperture — vanilla JS gallery + lightbox
   No external images: every tile is a generated gradient
   "field study", tuned per category to the Lumio palette.
   ========================================================= */

// ---- 1. Data -------------------------------------------------

// Base color stops per category, drawn from the Lumio signature
// gradients (Electric Aura, Sunset Vibe, Emerald Pulse) plus a
// warm Amber variant for Animals.
const PALETTES = {
  nature:       ["#0f9d68", "#17b598", "#2fd1b4", "#dff2c2"],
  architecture: ["#1b1b2e", "#3b2fd6", "#7c4ae0", "#b45cf0"],
  animals:      ["#5c3410", "#b6741b", "#e0a63a", "#f4c95d"],
  travel:       ["#ff7a3d", "#ff4d8d", "#ff2f7e", "#ffd166"],
};

const IMAGES = [
  { title: "Canopy Drift",       category: "nature" },
  { title: "Moss Signal",        category: "nature" },
  { title: "River Glass",        category: "nature" },
  { title: "Fern Static",        category: "nature" },
  { title: "Glass Spire",        category: "architecture" },
  { title: "Concrete Fold",      category: "architecture" },
  { title: "Atrium Light",       category: "architecture" },
  { title: "Stairwell Echo",     category: "architecture" },
  { title: "Feather Study",      category: "animals" },
  { title: "Den & Dust",         category: "animals" },
  { title: "Coral Wander",       category: "animals" },
  { title: "Amber Pride",        category: "animals" },
  { title: "Departure Gate",     category: "travel" },
  { title: "Coastal Route",      category: "travel" },
  { title: "Market Hour",        category: "travel" },
  { title: "Dune Line",          category: "travel" },
];

// ---- 2. Deterministic "random" so the layout is stable ------

function seededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Builds a one-of-a-kind CSS background for a given item index,
// layering a linear gradient with two soft radial "light" blobs.
function generateArtwork(index, category) {
  const rand = seededRandom(index * 97 + 13);
  const colors = PALETTES[category];
  const angle = Math.floor(rand() * 360);
  const blobX1 = Math.floor(20 + rand() * 60);
  const blobY1 = Math.floor(15 + rand() * 40);
  const blobX2 = Math.floor(20 + rand() * 60);
  const blobY2 = Math.floor(50 + rand() * 40);

  return `
    radial-gradient(circle at ${blobX1}% ${blobY1}%, ${colors[3]}55, transparent 55%),
    radial-gradient(circle at ${blobX2}% ${blobY2}%, ${colors[0]}66, transparent 60%),
    linear-gradient(${angle}deg, ${colors[1]} 0%, ${colors[2]} 55%, ${colors[0]} 100%)
  `.trim();
}

// ---- 3. Render gallery ---------------------------------------

const galleryEl = document.getElementById("gallery");
const visibleCountEl = document.getElementById("visibleCount");

function renderGallery() {
  galleryEl.innerHTML = "";
  IMAGES.forEach((item, index) => {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.type = "button";
    tile.dataset.category = item.category;
    tile.dataset.index = String(index);
    tile.setAttribute("aria-label", `Open ${item.title}, ${item.category}`);

    tile.innerHTML = `
      <div class="tile__art" style="background:${generateArtwork(index, item.category)}"></div>
      <div class="tile__overlay"></div>
      <span class="tile__expand" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 2H2v3M9 2h3v3M5 12H2V9M9 12h3V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <div class="tile__caption">
        <span class="tile__title">${item.title}</span>
        <span class="tile__tag">${item.category}</span>
      </div>
    `;

    tile.addEventListener("click", () => openLightbox(index));
    galleryEl.appendChild(tile);
  });
}

// ---- 4. Filtering ----------------------------------------------

const chips = document.querySelectorAll(".chip");

function applyFilter(filter) {
  const tiles = document.querySelectorAll(".tile");
  let visible = 0;
  tiles.forEach((tile) => {
    const match = filter === "all" || tile.dataset.category === filter;
    tile.classList.toggle("is-hidden", !match);
    if (match) visible++;
  });
  visibleCountEl.textContent = visible;
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    applyFilter(chip.dataset.filter);
  });
});

// ---- 5. Lightbox -------------------------------------------------

const lightbox = document.getElementById("lightbox");
const lbArt = document.getElementById("lbArt");
const lbTitle = document.getElementById("lbTitle");
const lbTag = document.getElementById("lbTag");
const lbCount = document.getElementById("lbCount");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");

let currentIndex = 0;
let lastFocusedEl = null;

// Only navigate within whatever the active filter currently shows,
// so Prev/Next never jump to a hidden category.
function visibleIndices() {
  return IMAGES
    .map((item, i) => i)
    .filter((i) => !document.querySelector(`.tile[data-index="${i}"]`).classList.contains("is-hidden"));
}

function showImage(index) {
  currentIndex = index;
  const item = IMAGES[index];
  lbArt.style.background = generateArtwork(index, item.category);
  lbTitle.textContent = item.title;
  lbTag.textContent = item.category;

  const order = visibleIndices();
  const pos = order.indexOf(index) + 1;
  lbCount.textContent = `${pos} / ${order.length}`;
}

function openLightbox(index) {
  lastFocusedEl = document.activeElement;
  showImage(index);
  lightbox.classList.add("is-active");
  document.body.classList.add("lb-open");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-active");
  document.body.classList.remove("lb-open");
  if (lastFocusedEl) lastFocusedEl.focus();
}

function stepImage(direction) {
  const order = visibleIndices();
  if (order.length === 0) return;
  const pos = order.indexOf(currentIndex);
  const nextPos = (pos + direction + order.length) % order.length;
  showImage(order[nextPos]);
}

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => stepImage(-1));
lbNext.addEventListener("click", () => stepImage(1));

lightbox.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", closeLightbox)
);

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("is-active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") stepImage(1);
  if (e.key === "ArrowLeft") stepImage(-1);
});

// ---- 6. Init -------------------------------------------------

renderGallery();
applyFilter("all");
