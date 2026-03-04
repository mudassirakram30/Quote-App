import { query, orderBy } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAC88vkNEk00nhfr7_VaeNDicGI9n22QlQ",
  authDomain: "quote-app-93780.firebaseapp.com",
  projectId: "quote-app-93780",
  storageBucket: "quote-app-93780.firebasestorage.app",
  messagingSenderId: "484417326692",
  appId: "1:484417326692:web:f44e11eda5bf937dd35971",
  measurementId: "G-V04YB5KG3Q"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const quoteInput = document.getElementById("quoteInput");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quotesDiv = document.getElementById("quotes");
const quoteCount = document.getElementById("quoteCount");

// Modal Elements
const modalOverlay = document.getElementById('modalOverlay');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const editTextarea = document.getElementById('editTextarea');
const cancelEditBtn = document.getElementById('cancelEdit');
const saveEditBtn = document.getElementById('saveEdit');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

let currentEditId = null;
let currentDeleteId = null;


function showModal(modal) {
  modal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
}


function hideModals() {
  editModal.classList.add('hidden');
  deleteModal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
  currentEditId = null;
  currentDeleteId = null;
}


function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


cancelEditBtn.addEventListener('click', hideModals);
cancelDeleteBtn.addEventListener('click', hideModals);
modalOverlay.addEventListener('click', hideModals);


function openEditModal(id, text) {
  currentEditId = id;
  editTextarea.value = text;
  showModal(editModal);
  editTextarea.focus();
}

saveEditBtn.addEventListener('click', async () => {
  if (!currentEditId) return;
  const newText = editTextarea.value.trim();
  if (!newText) {
    alert('Quote cannot be empty');
    return;
  }
  try {
    await updateDoc(doc(db, "quotes", currentEditId), { text: newText });
    hideModals();
    showToast('Quote updated');
  } catch (error) {
    alert('Failed to update quote. Try again.');
  }
});


function openDeleteModal(id) {
  currentDeleteId = id;
  showModal(deleteModal);
}

confirmDeleteBtn.addEventListener('click', async () => {
  if (!currentDeleteId) return;
  try {
    await deleteDoc(doc(db, "quotes", currentDeleteId));
    hideModals();
    showToast('Quote deleted');
  } catch (error) {
    alert('Failed to delete quote. Try again.');
  }
});


addQuoteBtn.addEventListener("click", async () => {
  const quote = quoteInput.value.trim();
  if (!quote) return alert("Please enter a quote");

  try {
    await addDoc(collection(db, "quotes"), {
      text: quote,
      createdAt: new Date()
    });
    quoteInput.value = "";
  } catch (error) {
    alert("Failed to add quote, try again.");
  }
});

quoteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addQuoteBtn.click();
  }
});


onSnapshot(collection(db, "quotes"), (snapshot) => {
  quotesDiv.innerHTML = "";

  snapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    const quoteElement = document.createElement("div");
    quoteElement.classList.add("quote");


    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    const formattedDate = createdAt.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) + ", " + createdAt.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    quoteElement.innerHTML = `
      <span>“${data.text}”</span>
      <small>${formattedDate}</small>
      <div class="quote-buttons">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;


    quoteElement.querySelector(".edit-btn").addEventListener("click", () => {
      openEditModal(id, data.text);
    });

 
    quoteElement.querySelector(".delete-btn").addEventListener("click", () => {
      openDeleteModal(id);
    });

    quotesDiv.appendChild(quoteElement);
  });


  const total = snapshot.size;
  quoteCount.textContent = total + (total === 1 ? " quote" : " quotes");
});