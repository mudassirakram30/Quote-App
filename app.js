// app.js - All Firebase Firestore Logic

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ─── Collection Reference ─────────────────────────────────────────────────────
const quotesCol = collection(db, "quotes");

// ─── DOM Elements ─────────────────────────────────────────────────────────────
const quoteInput   = document.getElementById("quoteInput");
const authorInput  = document.getElementById("authorInput");
const categoryInput= document.getElementById("categoryInput");
const addBtn       = document.getElementById("addBtn");
const quotesList   = document.getElementById("quotesList");
const searchInput  = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const totalCount   = document.getElementById("totalCount");
const randomBtn    = document.getElementById("randomBtn");
const randomDisplay= document.getElementById("randomDisplay");
const loadingEl    = document.getElementById("loading");
const emptyEl      = document.getElementById("emptyState");
const toastEl      = document.getElementById("toast");

// ─── State ────────────────────────────────────────────────────────────────────
let allQuotes   = [];
let editingId   = null;

// ─── Toast Notification ───────────────────────────────────────────────────────
function showToast(message, type = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// ─── Real-time Listener ───────────────────────────────────────────────────────
function listenToQuotes() {
  loadingEl.style.display = "flex";
  const q = query(quotesCol, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    allQuotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    loadingEl.style.display = "none";
    renderQuotes(allQuotes);
    updateCategoryFilter();
  }, (err) => {
    loadingEl.style.display = "none";
    showToast("Error loading quotes: " + err.message, "error");
  });
}

// ─── Render Quotes ────────────────────────────────────────────────────────────
function renderQuotes(quotes) {
  const search   = searchInput.value.toLowerCase();
  const category = filterSelect.value;

  const filtered = quotes.filter((q) => {
    const matchSearch =
      (q.quote || "").toLowerCase().includes(search) ||
      (q.author || "").toLowerCase().includes(search);
    const matchCategory = !category || q.category === category;
    return matchSearch && matchCategory;
  });

  totalCount.textContent = `${filtered.length} quote${filtered.length !== 1 ? "s" : ""}`;
  quotesList.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.style.display = "flex";
    return;
  }
  emptyEl.style.display = "none";

  filtered.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "quote-card";
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="quote-badge">${q.category || "General"}</div>
      <p class="quote-text">"${escapeHtml(q.quote)}"</p>
      <p class="quote-author">— ${escapeHtml(q.author || "Unknown")}</p>
      <div class="card-actions">
        <button class="btn-icon edit-btn" data-id="${q.id}" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon delete-btn" data-id="${q.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>`;
    quotesList.appendChild(card);
  });

  // Attach events
  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteQuote(btn.dataset.id))
  );
  document.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => startEdit(btn.dataset.id))
  );
}

// ─── Add / Update Quote ───────────────────────────────────────────────────────
addBtn.addEventListener("click", async () => {
  const quote    = quoteInput.value.trim();
  const author   = authorInput.value.trim();
  const category = categoryInput.value;

  if (!quote) { showToast("Please enter a quote!", "error"); return; }

  const isEditing = !!editingId; // capture before any async changes
  addBtn.disabled = true;
  addBtn.textContent = isEditing ? "Saving…" : "Adding…";

  try {
    if (isEditing) {
      await updateDoc(doc(db, "quotes", editingId), { quote, author, category });
      showToast("Quote updated! ✏️");
      cancelEdit();
    } else {
      await addDoc(quotesCol, { quote, author, category, createdAt: serverTimestamp() });
      showToast("Quote added! 🎉");
      clearForm();
    }
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = isEditing && editingId ? "Save Changes" : "Add Quote";
  }
});

// ─── Delete Quote ─────────────────────────────────────────────────────────────
async function deleteQuote(id) {
  if (!confirm("Delete this quote?")) return;
  try {
    await deleteDoc(doc(db, "quotes", id));
    showToast("Quote deleted 🗑️");
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}

// ─── Edit Quote ───────────────────────────────────────────────────────────────
function startEdit(id) {
  const q = allQuotes.find((q) => q.id === id);
  if (!q) return;
  editingId = id;
  quoteInput.value    = q.quote;
  authorInput.value   = q.author || "";
  categoryInput.value = q.category || "Motivation";
  addBtn.textContent  = "Save Changes";
  addBtn.classList.add("editing");
  document.getElementById("cancelEditBtn").style.display = "inline-flex";
  quoteInput.focus();
  document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
  editingId = null;
  clearForm();
  addBtn.textContent = "Add Quote";
  addBtn.classList.remove("editing");
  document.getElementById("cancelEditBtn").style.display = "none";
}

document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);

// ─── Random Quote ─────────────────────────────────────────────────────────────
randomBtn.addEventListener("click", () => {
  if (allQuotes.length === 0) { showToast("No quotes yet!", "error"); return; }
  const q = allQuotes[Math.floor(Math.random() * allQuotes.length)];
  randomDisplay.innerHTML = `
    <p class="rand-text">"${escapeHtml(q.quote)}"</p>
    <p class="rand-author">— ${escapeHtml(q.author || "Unknown")} <span class="rand-badge">${q.category || "General"}</span></p>`;
  randomDisplay.classList.add("visible");
});

// ─── Search & Filter ──────────────────────────────────────────────────────────
searchInput.addEventListener("input",  () => renderQuotes(allQuotes));
filterSelect.addEventListener("change", () => renderQuotes(allQuotes));

function updateCategoryFilter() {
  const categories = [...new Set(allQuotes.map((q) => q.category).filter(Boolean))];
  const current = filterSelect.value;
  filterSelect.innerHTML = `<option value="">All Categories</option>`;
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    if (c === current) opt.selected = true;
    filterSelect.appendChild(opt);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clearForm() {
  quoteInput.value = "";
  authorInput.value = "";
  categoryInput.value = "Motivation";
}

function escapeHtml(str = "") {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── Init ─────────────────────────────────────────────────────────────────────
listenToQuotes();