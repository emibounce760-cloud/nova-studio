// 1. CONNEXION À TA BASE DE DONNÉES CLOUD SUPABASE
const SUPABASE_URL = "https://ehicifgwmpyyaoxvzezw.supabase.co";
const SUPABASE_KEY = "sb_publishable_AJuaJ5zv3NZpOspUtVcZCg_6kIYGZRX";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PIN = "1234";
let isAdmin = false;

let products = [];
let cart = JSON.parse(localStorage.getItem("nova_cart")) || [];
let currentCategory = "tous";
let searchQuery = "";

// 2. CHARGER LES PRODUITS EN DIRECT DEPUIS LE CLOUD
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-12 text-sm">⏳ Chargement des articles depuis le Cloud...</p>`;

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="col-span-full text-center text-red-600 py-12 text-sm font-bold">⚠️ Erreur Cloud : Assure-toi d'avoir exécuté le script SQL dans Supabase (${error.message})</p>`;
    return;
  }

  products = data;
  renderProducts();
}

// 3. SYSTÈME D'AUTHENTIFICATION & PERMISSIONS VENDEUR
function unlockAdmin() {
  const code = prompt("🔐 Entrez le code PIN Vendeur (par défaut : 1234) :");
  if (code === ADMIN_PIN) {
    isAdmin = true;
    updateAdminUI();
  } else if (code !== null) {
    alert("❌ Code PIN incorrect ! Accès refusé.");
  }
}

function logoutAdmin() {
  isAdmin = false;
  updateAdminUI();
}

function updateAdminUI() {
  document.getElementById("admin-banner").classList.toggle("hidden", !isAdmin);
  document.getElementById("add-product-btn").classList.toggle("hidden", !isAdmin);
  document.getElementById("admin-lock-btn").classList.toggle("hidden", isAdmin);
  renderProducts();
}

function handleSearch(value) {
  searchQuery = value.toLowerCase().trim();
  renderProducts();
}

// 4. AFFICHAGE DES PRODUITS
function renderProducts() {
  const grid = document.getElementById("product-grid");
  const filtered = products.filter(p => {
    const matchCategory = currentCategory === "tous" || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-12 text-sm">Aucun article trouvé.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between">
      ${isAdmin ? `
        <button onclick="deleteProduct(${product.id})" class="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md hover:bg-red-700">
          🗑️ Supprimer
        </button>
      ` : ""}
      <div>
        <img src="${product.image}" alt="${product.name}" class="w-full h-44 object-cover bg-stone-100">
        <div class="p-3">
          <h3 class="font-bold text-xs sm:text-sm text-stone-900 leading-snug min-h-[2.25rem] flex items-center">${product.name}</h3>
          <p class="text-emerald-700 font-black text-sm mt-1">${product.price.toLocaleString("fr-FR")} FCFA</p>
        </div>
      </div>
      <div class="p-3 pt-0">
        <button onclick="addToCart(${product.id})" class="w-full bg-stone-900 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition">
          + Ajouter au panier
        </button>
      </div>
    </div>
  `).join("");
}

// 5. AJOUTER ET SUPPRIMER DANS LE CLOUD SUPABASE
// 5. AJOUTER (AVEC PHOTO DU TÉLÉPHONE) ET SUPPRIMER DANS SUPABASE
let selectedImageData = ""; // Garde en mémoire la photo choisie

function toggleAdmin(show) {
  document.getElementById("admin-modal").classList.toggle("hidden", !show);
}

// Compresse automatiquement la photo du téléphone pour qu'elle charge vite
function previewSelectedImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const maxWidth = 500;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Transforme l'image compressée en texte léger prêt pour Supabase
      selectedImageData = canvas.toDataURL("image/jpeg", 0.75);

      const preview = document.getElementById("image-preview");
      preview.src = selectedImageData;
      preview.classList.remove("hidden");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function addNewProduct() {
  const name = document.getElementById("new-name").value.trim();
  const price = parseInt(document.getElementById("new-price").value, 10);
  const category = document.getElementById("new-category").value;
  const image = selectedImageData || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

  if (!name || !price) {
    alert("Indique au moins le nom et le prix de l'article !");
    return;
  }

  const btn = document.getElementById("publish-btn");
  btn.textContent = "⏳ Publication en cours...";
  btn.disabled = true;

  const { error } = await db
    .from("products")
    .insert([{ name, category, price, image }]);

  btn.textContent = "Publier dans la boutique";
  btn.disabled = false;

  if (error) {
    alert("Erreur Cloud : " + error.message);
    return;
  }

  // Réinitialiser le formulaire
  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-image-file").value = "";
  document.getElementById("image-preview").classList.add("hidden");
  selectedImageData = "";

  toggleAdmin(false);
  await loadProducts();
}


async function deleteProduct(productId) {
  if (!confirm("Voulez-vous vraiment supprimer cet article pour tous les clients ?")) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    alert("Erreur lors de la suppression : " + error.message);
    return;
  }

  await loadProducts();
}

// 6. GESTION DES CATÉGORIES ET DU PANIER WHATSAPP
function filterCategory(category) {
  currentCategory = category;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.className = btn.dataset.cat === category
      ? "cat-btn bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
      : "cat-btn bg-stone-200 text-stone-700 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap";
  });
  renderProducts();
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveAndRefreshCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
  saveAndRefreshCart();
}

function saveAndRefreshCart() {
  localStorage.setItem("nova_cart", JSON.stringify(cart));
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  document.getElementById("cart-badge").textContent = totalCount;
  document.getElementById("cart-total").textContent = `${totalPrice.toLocaleString("fr-FR")} FCFA`;

  const container = document.getElementById("cart-items");
  container.innerHTML = cart.length === 0
    ? `<p class="text-center text-stone-400 text-sm py-12">Ton panier est vide.</p>`
    : cart.map(item => `
      <div class="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200">
        <div class="flex items-center gap-3">
          <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover">
          <div>
            <h4 class="text-xs font-bold text-stone-900">${item.name}</h4>
            <p class="text-xs text-emerald-700 font-bold">${(item.price * item.quantity).toLocaleString("fr-FR")} FCFA</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity(${item.id}, -1)" class="w-7 h-7 rounded-lg bg-stone-200 font-bold text-xs">-</button>
          <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
          <button onclick="updateQuantity(${item.id}, 1)" class="w-7 h-7 rounded-lg bg-stone-900 text-white font-bold text-xs">+</button>
        </div>
      </div>
    `).join("");
  updateWhatsAppPreview();
}

function toggleCart(show) {
  document.getElementById("cart-modal").classList.toggle("hidden", !show);
}

function buildWhatsAppMessage() {
  const name = document.getElementById("client-name").value.trim() || "Client";
  const address = document.getElementById("client-address").value.trim() || "Non précisé";
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (cart.length === 0) return "Ajoute un article pour voir l'aperçu...";
  const lines = cart.map(i => `• ${i.quantity}x ${i.name} (${(i.price * i.quantity).toLocaleString("fr-FR")} FCFA)`).join("\n");
  return `Bonjour Rodis STUDIO 👋\nJe souhaite commander :\n\n${lines}\n\n💰 *TOTAL : ${total.toLocaleString("fr-FR")} FCFA*\n👤 Client : ${name}\n📍 Livraison : ${address}`;
}

function updateWhatsAppPreview() {
  document.getElementById("whatsapp-preview").textContent = buildWhatsAppMessage();
}

function checkoutWhatsApp() {
  if (cart.length === 0) return alert("Ton panier est vide !");
  const phone = document.getElementById("vendor-phone").value.replace(/\D/g, "");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage())}`, "_blank");
}

loadProducts();
saveAndRefreshCart();