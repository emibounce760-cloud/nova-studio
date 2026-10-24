// 1. CATALOGUE DE BASE + ÉTAT DES PERMISSIONS
const defaultProducts = [
  { id: 1, name: "Oversize Hoodie Noir", category: "vetements", price: 18000, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500" },
  { id: 2, name: "Montre Chrono Acier", category: "accessoires", price: 25000, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500" },
  { id: 3, name: "Sac Cabas Cuir Minimal", category: "sacs", price: 22000, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" },
  { id: 4, name: "Sneakers Urbaines Blanc", category: "chaussures", price: 30000, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500" },
  { id: 5, name: "Chemise Lin Beige", category: "vetements", price: 15000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500" },
  { id: 6, name: "Bracelet Maille Argent", category: "accessoires", price: 8500, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500" },
  { id: 7, name: "Lunettes de Soleil Minimal", category: "accessoires", price: 10000, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500" }
];

const ADMIN_PIN = "1234"; // Code secret du vendeur
let isAdmin = false;      // Par défaut, le visiteur est un simple client

let products = JSON.parse(localStorage.getItem("rodis_products")) || defaultProducts;
let cart = JSON.parse(localStorage.getItem("nova_cart")) || [];
let currentCategory = "tous";
let searchQuery = "";

// 2. SYSTÈME D'AUTHENTIFICATION & PERMISSIONS VENDEUR
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
  renderProducts(); // Recharge la grille pour afficher ou cacher la corbeille de suppression
}

function handleSearch(value) {
  searchQuery = value.toLowerCase().trim();
  renderProducts();
}

// 3. AFFICHAGE DES PRODUITS (AVEC BOUTON SUPPRIMER SI ADMIN = TRUE)
function renderProducts() {
  const grid = document.getElementById("product-grid");
  const filtered = products.filter(p => {
    const matchCategory = currentCategory === "tous" || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-stone-400 py-12 text-sm">Aucun article ne correspond à "${searchQuery}".</p>`;
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

// 4. CRÉER ET SUPPRIMER UN PRODUIT (CRUD VENDEUR)
function toggleAdmin(show) {
  document.getElementById("admin-modal").classList.toggle("hidden", !show);
}

function addNewProduct() {
  const name = document.getElementById("new-name").value.trim();
  const price = parseInt(document.getElementById("new-price").value, 10);
  const category = document.getElementById("new-category").value;
  const image = document.getElementById("new-image").value.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";

  if (!name || !price) {
    alert("Indique au moins le nom et le prix de l'article !");
    return;
  }

  const newProduct = { id: Date.now(), name, category, price, image };
  products.unshift(newProduct);
  localStorage.setItem("rodis_products", JSON.stringify(products));

  document.getElementById("new-name").value = "";
  document.getElementById("new-price").value = "";
  document.getElementById("new-image").value = "";
  toggleAdmin(false);
  renderProducts();
}

function deleteProduct(productId) {
  if (!confirm("Voulez-vous vraiment retirer cet article de la boutique ?")) return;
  products = products.filter(p => p.id !== productId);
  localStorage.setItem("rodis_products", JSON.stringify(products));
  renderProducts();
}

// 5. GESTION DES CATÉGORIES ET DU PANIER
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

renderProducts();
saveAndRefreshCart();