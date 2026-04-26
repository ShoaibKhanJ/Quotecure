/* =============================================
   QUOTE CURE — Scalable Quote Platform
   JS: JSON-driven, Event-delegated, Clean
   =============================================
   Data fields (from quotes.json):
     text       — quote string
     author     — person or source name
     authorType — Entrepreneur | Philosopher | Writer | Spiritual | Proverb
     vibe       — Motivation | Discipline | Confidence | Calm | Sad | Love | Fearless | Hope | Focus | Angry
     theme      — Success | Mindset | Life | Business | Study | Wealth | Health | Relationships | Productivity | Self-growth
   ============================================= */

// ─── STATE ────────────────────────────────────────────
let quotes = [];                              // populated after fetch
let currentFilter = { type: null, value: null };
let searchQuery = "";
let favorites = [];
let toastTimer = null;

// ─── DOM REFERENCES ───────────────────────────────────
const $ = (id) => document.getElementById(id);

const heroQuote       = $("heroQuote");
const heroAuthor      = $("heroAuthor");
const searchInput     = $("searchInput");
const searchClear     = $("searchClear");
const filterOptions   = $("filterOptions");
const activeFilterInfo= $("activeFilterInfo");
const activeFilterText= $("activeFilterText");
const clearFilterBtn  = $("clearFilterBtn");
const quotesGrid      = $("quotesGrid");
const noResults       = $("noResults");
const themeToggle     = $("themeToggle");
const favToggle       = $("favToggle");
const favCount        = $("favCount");
const favOverlay      = $("favOverlay");
const favPanel        = $("favPanel");
const favPanelClose   = $("favPanelClose");
const favPanelList    = $("favPanelList");
const favEmpty        = $("favEmpty");
const toast           = $("toast");
const toastMsg        = $("toastMsg");

// ─── FAVORITES HELPERS ────────────────────────────────
function loadFavorites() {
  try {
    const raw = localStorage.getItem("quotecure_favs");
    favorites = JSON.parse(raw || "[]");
    if (!Array.isArray(favorites)) favorites = [];
  } catch (_) {
    favorites = [];
  }
}

function saveFavorites() {
  localStorage.setItem("quotecure_favs", JSON.stringify(favorites));
}

// ─── QUOTE LOOKUP ─────────────────────────────────────
function quoteIndexByText(text) {
  return quotes.findIndex(q => q.text === text);
}

// ─── FETCH QUOTES FROM JSON ───────────────────────────
async function fetchQuotes() {
  try {
    const res = await fetch("quotes.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Empty data");
    return data;
  } catch (err) {
    console.warn("quotes.json fetch failed, using inline fallback:", err.message);
    return FALLBACK_QUOTES;
  }
}

// ─── INLINE FALLBACK (only used if quotes.json fails) ─
const FALLBACK_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", authorType: "Entrepreneur", vibe: "Motivation", theme: "Success" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", authorType: "Philosopher", vibe: "Discipline", theme: "Mindset" },
  { text: "The wound is the place where the light enters you.", author: "Rumi", authorType: "Spiritual", vibe: "Sad", theme: "Life" },
  { text: "Do not feel lonely; the entire universe is inside you.", author: "Rumi", authorType: "Spiritual", vibe: "Confidence", theme: "Self-growth" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", authorType: "Writer", vibe: "Motivation", theme: "Success" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", authorType: "Philosopher", vibe: "Hope", theme: "Mindset" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", authorType: "Proverb", vibe: "Discipline", theme: "Life" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", authorType: "Philosopher", vibe: "Confidence", theme: "Self-growth" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", authorType: "Philosopher", vibe: "Hope", theme: "Life" },
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk", authorType: "Entrepreneur", vibe: "Fearless", theme: "Business" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", authorType: "Spiritual", vibe: "Confidence", theme: "Mindset" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", authorType: "Spiritual", vibe: "Calm", theme: "Life" },
  { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle", authorType: "Philosopher", vibe: "Love", theme: "Relationships" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi", authorType: "Spiritual", vibe: "Love", theme: "Life" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", authorType: "Spiritual", vibe: "Motivation", theme: "Study" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", authorType: "Writer", vibe: "Motivation", theme: "Productivity" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali", authorType: "Writer", vibe: "Discipline", theme: "Life" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", authorType: "Writer", vibe: "Discipline", theme: "Wealth" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", authorType: "Entrepreneur", vibe: "Fearless", theme: "Business" },
  { text: "What does not kill me makes me stronger.", author: "Friedrich Nietzsche", authorType: "Philosopher", vibe: "Fearless", theme: "Mindset" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", authorType: "Entrepreneur", vibe: "Motivation", theme: "Success" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", authorType: "Philosopher", vibe: "Discipline", theme: "Self-growth" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", authorType: "Philosopher", vibe: "Fearless", theme: "Mindset" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", authorType: "Philosopher", vibe: "Calm", theme: "Mindset" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", authorType: "Spiritual", vibe: "Motivation", theme: "Productivity" },
  { text: "This too shall pass.", author: "Unknown", authorType: "Proverb", vibe: "Calm", theme: "Life" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", authorType: "Entrepreneur", vibe: "Discipline", theme: "Productivity" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", authorType: "Writer", vibe: "Fearless", theme: "Success" },
  { text: "The greatest wealth is health.", author: "Unknown", authorType: "Proverb", vibe: "Calm", theme: "Health" },
  { text: "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.", author: "Helen Keller", authorType: "Writer", vibe: "Hope", theme: "Success" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", authorType: "Writer", vibe: "Hope", theme: "Study" }
];

// ─── ASYNC INIT ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  quotes = await fetchQuotes();
  loadFavorites();
  loadTheme();
  setQuoteOfDay();
  buildFilterChips("vibe");            // default tab = Vibe
  renderQuotes();
  updateFavCount();
  bindGlobalEvents();
});

// ─── QUOTE OF THE DAY ─────────────────────────────────
function setQuoteOfDay() {
  if (!quotes.length) return;
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const q = quotes[seed % quotes.length];
  heroQuote.textContent = q.text;
  heroAuthor.textContent = q.author;
}

// ─── THEME ────────────────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem("quotecure_theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("quotecure_theme", next);
}

// ─── FILTER SYSTEM ────────────────────────────────────

// Get sorted unique values for any field
function getUniqueValues(field) {
  const seen = new Set();
  quotes.forEach(q => seen.add(q[field]));
  return [...seen].sort();
}

// Build filter chips for a given type (field name = vibe | theme | author)
function buildFilterChips(type) {
  // Highlight active tab button
  document.querySelectorAll(".filter-type-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filterType === type);
  });

  const items = getUniqueValues(type);

  filterOptions.innerHTML = "";
  items.forEach(item => {
    const chip = document.createElement("button");
    chip.className = "filter-chip";
    chip.textContent = item;
    chip.dataset.filterField = type;
    chip.dataset.filterValue = item;
    if (currentFilter.type === type && currentFilter.value === item) {
      chip.classList.add("active");
    }
    filterOptions.appendChild(chip);
  });
}

function handleFilterClick(type, value) {
  // Toggle off if clicking same active filter
  if (currentFilter.type === type && currentFilter.value === value) {
    clearFilter();
    return;
  }

  currentFilter = { type, value };

  // Update chip visual states
  document.querySelectorAll(".filter-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filterValue === value);
  });

  // Show info bar
  const label = type.charAt(0).toUpperCase() + type.slice(1);   // "Vibe" / "Theme" / "Author"
  const count = getFilteredQuotes().length;
  activeFilterText.textContent = label + ": " + value + " \u2014 " + count + " quote" + (count !== 1 ? "s" : "");
  activeFilterInfo.classList.add("visible");

  renderQuotes();
}

function clearFilter() {
  currentFilter = { type: null, value: null };
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  activeFilterInfo.classList.remove("visible");
  renderQuotes();
}

// ─── SEARCH ───────────────────────────────────────────
function handleSearch(raw) {
  searchQuery = raw.trim().toLowerCase();
  searchClear.classList.toggle("visible", raw.length > 0);
  renderQuotes();
}

// ─── FILTERING ENGINE ─────────────────────────────────
function getFilteredQuotes() {
  const hasFilter = currentFilter.type && currentFilter.value;

  return quotes.filter(q => {
    // Category filter — type IS the field name (vibe/theme/author)
    if (hasFilter && q[currentFilter.type] !== currentFilter.value) return false;

    // Search filter — search across all text fields including authorType
    if (searchQuery) {
      const hay = (q.text + " " + q.author + " " + q.authorType + " " + q.vibe + " " + q.theme).toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }

    return true;
  });
}

// ─── RENDER QUOTES ────────────────────────────────────
function renderQuotes() {
  const filtered = getFilteredQuotes();

  if (filtered.length === 0) {
    quotesGrid.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  quotesGrid.style.display = "grid";
  noResults.style.display = "none";

  const favSet = new Set(favorites);

  quotesGrid.innerHTML = filtered.map((q, i) => {
    const qi = quoteIndexByText(q.text);
    const liked = favSet.has(q.text);
    return (
      '<article class="quote-card" style="animation-delay:' + Math.min(i * 0.06, 0.5) + 's">' +
        '<p class="quote-text">' + esc(q.text) + '</p>' +
        '<div class="quote-footer">' +
          '<span class="quote-author"><em>\u2014</em> ' + esc(q.author) + '</span>' +
          '<div class="quote-tags">' +
            '<span class="quote-tag">' + esc(q.vibe) + '</span>' +
            '<span class="quote-tag">' + esc(q.theme) + '</span>' +
          '</div>' +
          '<div class="quote-actions">' +
            '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" data-qi="' + qi + '" title="Save">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
            '</button>' +
            '<button class="action-btn copy-btn" data-qi="' + qi + '" title="Copy">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
            '</button>' +
            '<button class="action-btn share-btn" data-qi="' + qi + '" title="Share">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join("");
}

// ─── HTML ESCAPING ────────────────────────────────────
function esc(str) {
  const m = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"]/g, c => m[c] || c);
}

// ─── CLIPBOARD ────────────────────────────────────────
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(function () {
      fallbackCopy(text);
    });
  }
  fallbackCopy(text);
  return Promise.resolve();
}

function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(ta);
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

// ─── FAVORITE TOGGLE ──────────────────────────────────
function toggleFavorite(text) {
  var idx = favorites.indexOf(text);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast("Removed from saved");
  } else {
    favorites.push(text);
    showToast("Saved to favorites \u2764\uFE0F");
  }
  saveFavorites();
  updateFavCount();
}

function updateFavCount() {
  favCount.textContent = favorites.length;
  favCount.classList.toggle("visible", favorites.length > 0);
}

// ─── FAVORITES PANEL ──────────────────────────────────
function openFavPanel() {
  renderFavPanel();
  favOverlay.classList.add("open");
  favPanel.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeFavPanel() {
  favOverlay.classList.remove("open");
  favPanel.classList.remove("open");
  document.body.style.overflow = "";
}

function renderFavPanel() {
  var favSet = new Set(favorites);
  var favQuotes = quotes.filter(function (q) { return favSet.has(q.text); });

  if (favQuotes.length === 0) {
    favPanelList.style.display = "none";
    favEmpty.classList.add("visible");
    return;
  }

  favPanelList.style.display = "block";
  favEmpty.classList.remove("visible");

  favPanelList.innerHTML = favQuotes.map(function (q) {
    var qi = quoteIndexByText(q.text);
    return (
      '<div class="fav-panel-card">' +
        '<p class="fq-text">' + esc(q.text) + '</p>' +
        '<p class="fq-author">\u2014 ' + esc(q.author) + '</p>' +
        '<button class="fq-remove" data-qi="' + qi + '">Remove</button>' +
      '</div>'
    );
  }).join("");
}

// ─── GLOBAL EVENT LISTENERS (one-time, delegated) ─────
function bindGlobalEvents() {

  // ── Theme toggle ──
  themeToggle.addEventListener("click", toggleTheme);

  // ── Search input ──
  searchInput.addEventListener("input", function (e) {
    handleSearch(e.target.value);
  });

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    handleSearch("");
    searchInput.focus();
  });

  // ── Filter type tabs (Vibe / Theme / Author) ──
  document.querySelectorAll(".filter-type-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.dataset.filterType;
      // Clear old filter when switching category
      if (currentFilter.type && currentFilter.type !== type) {
        clearFilter();
      }
      buildFilterChips(type);
    });
  });

  // ── Filter chips (delegated — survives chip rebuilds) ──
  filterOptions.addEventListener("click", function (e) {
    var chip = e.target.closest(".filter-chip");
    if (!chip) return;
    var type  = chip.dataset.filterField;
    var value = chip.dataset.filterValue;
    handleFilterClick(type, value);
  });

  // ── Clear filter button ──
  clearFilterBtn.addEventListener("click", clearFilter);

  // ── Quote card actions (delegated on grid — survives innerHTML) ──
  quotesGrid.addEventListener("click", function (e) {
    // ── LIKE ──
    var likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
      var qi = parseInt(likeBtn.dataset.qi, 10);
      var q = quotes[qi];
      if (!q) return;
      toggleFavorite(q.text);
      var nowLiked = favorites.includes(q.text);
      likeBtn.classList.toggle("liked", nowLiked);
      likeBtn.querySelector("svg").setAttribute("fill", nowLiked ? "currentColor" : "none");
      return;
    }

    // ── COPY ──
    var copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      var qi2 = parseInt(copyBtn.dataset.qi, 10);
      var q2 = quotes[qi2];
      if (!q2) return;
      copyText(q2.text).then(function () {
        copyBtn.classList.add("copied");
        showToast("Copied to clipboard!");
        setTimeout(function () { copyBtn.classList.remove("copied"); }, 1500);
      });
      return;
    }

    // ── SHARE ──
    var shareBtn = e.target.closest(".share-btn");
    if (shareBtn) {
      var qi3 = parseInt(shareBtn.dataset.qi, 10);
      var q3 = quotes[qi3];
      if (!q3) return;
      var shareText = "\u201C" + q3.text + "\u201D \u2014 " + q3.author;

      if (navigator.share) {
        navigator.share({ title: "Quote Cure", text: shareText }).catch(function () {});
      } else {
        copyText(shareText).then(function () {
          showToast("Quote copied for sharing!");
        });
      }
      return;
    }
  });

  // ── Favorites panel open/close ──
  favToggle.addEventListener("click", openFavPanel);
  favPanelClose.addEventListener("click", closeFavPanel);
  favOverlay.addEventListener("click", closeFavPanel);

  // ── Favorites panel remove buttons (delegated) ──
  favPanelList.addEventListener("click", function (e) {
    var removeBtn = e.target.closest(".fq-remove");
    if (!removeBtn) return;
    var qi = parseInt(removeBtn.dataset.qi, 10);
    var q = quotes[qi];
    if (!q) return;
    toggleFavorite(q.text);
    renderFavPanel();
    renderQuotes();   // sync heart icons in grid
  });

  // ── Keyboard: Escape closes panel ──
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeFavPanel();
  });
}
