// ==========================================
// 1. CONFIGURATION CLIENT (ÉDITION PRESTIGE)
// ==========================================
const SHOP_CONFIG = {
  name: "RODIS MAISON",
  tagline: "Haute Horlogerie & Prêt-à-Porter",
  whatsappPhone: "22890000000", // <-- Mets ton numéro ou celui du client ici
  adminPin: "1234",
  currency: "FCFA"
};

// 2. CONNEXION AU CLOUD SUPABASE
const SUPABASE_URL = "https://ehicifgwmpyyaoxvzezw.supabase.co";
const SUPABASE_KEY = "sb_publishable_AJuaJ5zv3NZpOspUtVcZCg_6kIYGZRX";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAdmin = false;
let products = [];
let cart = JSON.parse(localStorage.getItem("nova_cart")) || [];
let currentCategory = "tous";
let searchQuery = "";
let selectedImageData = "";

function initShopBranding() {
  const nameEl = document.getElementById("shop-name");
  const taglineEl = document.getElementById("shop-tagline");
  const titleEl = document.getElementById("page-title");
  if (nameEl) nameEl.textContent = SHOP_CONFIG.name;
  if (taglineEl) taglineEl.textContent = SHOP_CONFIG.tagline;
  if (titleEl) titleEl.textContent = `${SHOP_CONFIG.name} — Collection Privée`;
}

// 3. CHARGER LES PIÈCES DEPUIS SUPABASE
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-16 text-xs uppercase tracking-widest">Chargement de la collection privée...</p>`;

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="col-span-full text-center text-red-600 py-12 text-xs font-bold">⚠️ Erreur Cloud : ${error.message}</p>`;
    return;
  }

  products = data;
  renderProducts();
}

// 4. MODE DIRECTION & PERMISSIONS
function unlockAdmin() {
  const code = prompt("🔐 Code PIN Direction :");
  if (code === SHOP_CONFIG.adminPin) {
    isAdmin = true;
    updateAdminUI();
  } else if (code !== null) {
    alert("❌ Code PIN incorrect.");
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

// 5. AFFICHAGE DES CARTES PRODUITS LUXE (AVEC ZOOM AU CLIC)
function renderProducts() {
  const grid = document.getElementById("product-grid");
  const filtered = products.filter(p => {
    const matchCategory = currentCategory === "tous" || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-16 text-xs uppercase tracking-widest">Aucune pièce ne correspond à votre recherche.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="group relative bg-white border border-stone-200/90 flex flex-col justify-between transition duration-300 hover:shadow-xl hover:border-stone-400">
      ${isAdmin ? `
        <div class="absolute top-3 right-3 z-20 flex gap-1.5">
          <button onclick="editPrice(${product.id}, ${product.price})" class="bg-[#C5A059] text-stone-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-md">
            ✏️ Prix
          </button>
          <button onclick="deleteProduct(${product.id})" class="bg-stone-950 text-white text-[10px] font-bold px-2.5 py-1 shadow-md hover:bg-red-700">
            🗑️
          </button>
        </div>
      ` : `
        <span class="absolute top-3 left-3 z-10 bg-stone-950/85 backdrop-blur-xs text-[#C5A059] text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium pointer-events-none">
          Édition Prestige
        </span>
      `}
      <div>
        <div onclick="openProductModal(${product.id})" class="cursor-pointer overflow-hidden bg-stone-100 h-56 sm:h-64 relative">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out">
          <span class="absolute bottom-2 right-2 bg-stone-950/80 text-[#C5A059] text-[9px] uppercase tracking-widest px-2.5 py-1 font-semibold shadow-sm">
            🔍 Voir de près
          </span>
        </div>
        <div onclick="openProductModal(${product.id})" class="p-4 text-center cursor-pointer">
          <h3 class="font-luxury text-lg sm:text-xl font-bold text-stone-950 tracking-wide line-clamp-1">${product.name}</h3>
          <div class="w-8 h-[1px] bg-[#C5A059] mx-auto my-2"></div>
          <p class="text-stone-800 font-semibold text-xs sm:text-sm tracking-widest uppercase">${product.price.toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}</p>
        </div>
      </div>
      <div class="px-4 pb-4">
        <button onclick="addToCart(${product.id})" class="w-full bg-stone-950 hover:bg-[#C5A059] text-white hover:text-stone-950 text-[10px] uppercase tracking-[0.2em] font-semibold py-3 transition duration-300">
          + Sélectionner
        </button>
      </div>
    </div>
  `).join("");
}

// 6. VUE ÉCRIN (ZOOM PHOTO HAUTE DÉFINITION AUTO-INJECTÉ)
function ensureProductModalExists() {
  if (document.getElementById("product-modal")) return;
  const modalHTML = `
    <div id="product-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
      <div onclick="closeProductModal()" class="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      <div class="relative bg-stone-950 text-white max-w-md w-full overflow-hidden border border-[#C5A059]/40 shadow-2xl z-10">
        <button onclick="closeProductModal()" class="absolute top-3 right-3 z-20 bg-stone-950/80 text-[#C5A059] border border-[#C5A059]/40 w-8 h-8 flex items-center justify-center text-xs font-bold hover:bg-[#C5A059] hover:text-stone-950 transition">
          ✕
        </button>
        <div class="bg-stone-900 h-80 sm:h-96 overflow-hidden">
          <img id="modal-img" src="" alt="" class="w-full h-full object-cover">
        </div>
        <div class="p-6 text-center space-y-3">
          <span class="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] block">✦ Pièce Certifiée • Collection Privée ✦</span>
          <h3 id="modal-title" class="font-luxury text-2xl sm:text-3xl font-bold tracking-wide text-white"></h3>
          <p id="modal-price" class="text-[#C5A059] font-semibold text-sm tracking-widest uppercase"></p>
          <div class="pt-2">
            <button id="modal-add-btn" class="w-full bg-[#C5A059] hover:opacity-90 text-stone-950 text-xs uppercase tracking-[0.2em] font-bold py-3.5 transition">
              + Ajouter à ma Sélection
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function openProductModal(productId) {
  ensureProductModalExists();
  const product = products.find(p => p.id == productId);
  if (!product) return;

  document.getElementById("modal-img").src = product.image;
  document.getElementById("modal-img").alt = product.name;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-price").textContent = `${product.price.toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}`;

  const addBtn = document.getElementById("modal-add-btn");
  addBtn.onclick = function() {
    addToCart(product.id);
    closeProductModal();
    toggleCart(true);
  };

  document.getElementById("product-modal").classList.remove("hidden");
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.add("hidden");
}

// 7. CRUD SUPABASE (AJOUT, MODIFICATION PRIX, SUPPRESSION)
function toggleAdmin(show) {
  document.getElementById("admin-modal").classList.toggle("hidden", !show);
}

function previewSelectedImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const maxWidth = 600;
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

      selectedImageData = canvas.toDataURL("image/jpeg", 0.8);

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
  const image = selectedImageData || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";

  if (!name || !price) {
    alert("Veuillez renseigner le nom et le prix de la pièce.");
    return;
  }

  const btn = document.getElementById("publish-btn");
  btn.textContent = "⏳ Publication...";
  btn.disabled = true;

  const { error } = await db
    .from("products")
    .insert([{ name, category, price, image }]);

  btn.textContent = "Ajouter à la Collection";
  btn.disabled = false;

  if (error) {
    alert("Erreur Cloud : " + error.message);
    return;
  }

  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-image-file").value = "";
  document.getElementById("image-preview").classList.add("hidden");
  selectedImageData = "";

  toggleAdmin(false);
  await loadProducts();
}

async function editPrice(productId, currentPrice) {
  const input = prompt(`💰 Nouveau tarif en ${SHOP_CONFIG.currency} :`, currentPrice);
  if (input === null) return;

  const newPrice = parseInt(input, 10);
  if (!newPrice || newPrice <= 0) {
    alert("Veuillez entrer un tarif valide.");
    return;
  }

  const { error } = await db
    .from("products")
    .update({ price: newPrice })
    .eq("id", productId);

  if (error) {
    alert("Erreur lors de la modification : " + error.message);
    return;
  }

  await loadProducts();
}

async function deleteProduct(productId) {
  if (!confirm("Retirer définitivement cette pièce de la collection ?")) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  await loadProducts();
}

// 8. GESTION DES COLLECTIONS ET DE LA CONCIERGERIE WHATSAPP
function filterCategory(category) {
  currentCategory = category;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.className = btn.dataset.cat === category
      ? "cat-btn bg-stone-950 text-[#C5A059] border border-stone-950 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition"
      : "cat-btn bg-white text-stone-600 border border-stone-200 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition";
  });
  renderProducts();
}

function addToCart(productId) {
  const product = products.find(p => p.id == productId);
  const existing = cart.find(item => item.id == productId);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveAndRefreshCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(i => i.id == productId);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(i => i.id != productId);
  saveAndRefreshCart();
}

function saveAndRefreshCart() {
  localStorage.setItem("nova_cart", JSON.stringify(cart));
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  document.getElementById("cart-badge").textContent = totalCount;
  document.getElementById("cart-total").textContent = `${totalPrice.toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}`;

  const container = document.getElementById("cart-items");
  container.innerHTML = cart.length === 0
    ? `<p class="text-center text-stone-400 text-xs uppercase tracking-widest py-16">Votre sélection est vide.</p>`
    : cart.map(item => `
      <div class="flex items-center justify-between bg-white p-3 border border-stone-200">
        <div class="flex items-center gap-3">
          <img src="${item.image}" class="w-14 h-14 object-cover border border-stone-200">
          <div>
            <h4 class="font-luxury text-base font-bold text-stone-950">${item.name}</h4>
            <p class="text-[11px] gold-text font-bold tracking-wider">${(item.price * item.quantity).toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 bg-stone-100 font-bold text-xs">-</button>
          <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
          <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 bg-stone-950 text-[#C5A059] font-bold text-xs">+</button>
        </div>
      </div>
    `).join("");
  updateWhatsAppPreview();
}

function toggleCart(show) {
  document.getElementById("cart-modal").classList.toggle("hidden", !show);
}

function buildWhatsAppMessage() {
  const name = document.getElementById("client-name").value.trim() || "Client VIP";
  const address = document.getElementById("client-address").value.trim() || "À confirmer";
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (cart.length === 0) return "Sélectionnez une pièce pour préparer votre commande VIP...";
  const lines = cart.map(i => `▪ ${i.quantity}x ${i.name} — ${(i.price * i.quantity).toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}`).join("\n");
  return `✨ *CONCIERGERIE ${SHOP_CONFIG.name}* ✨\nBonjour, je souhaite commander la sélection suivante :\n\n${lines}\n\n👑 *TOTAL : ${total.toLocaleString("fr-FR")} ${SHOP_CONFIG.currency}*\n👤 Client : ${name}\n📍 Lieu de livraison : ${address}`;
}

function updateWhatsAppPreview() {
  document.getElementById("whatsapp-preview").textContent = buildWhatsAppMessage();
}

function checkoutWhatsApp() {
  if (cart.length === 0) return alert("Votre sélection est vide.");
  const phone = SHOP_CONFIG.whatsappPhone.replace(/\D/g, "");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage())}`, "_blank");
}

initShopBranding();
loadProducts();
saveAndRefreshCart();