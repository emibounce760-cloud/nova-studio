// 1. BASE DE DONNÉES DES PRODUITS (7 ARTICLES)
const products = [
  {
    id: 1,
    name: "Oversize Hoodie Noir",
    category: "vetements",
    price: 18000,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"
  },
  {
    id: 2,
    name: "Montre Chrono Acier",
    category: "accessoires",
    price: 25000,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500"
  },
  {
    id: 3,
    name: "Sac Cabas Cuir Minimal",
    category: "sacs",
    price: 22000,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500"
  },
  {
    id: 4,
    name: "Sneakers Urbaines Blanc",
    category: "chaussures",
    price: 30000,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"
  },
  {
    id: 5,
    name: "Chemise Lin Beige",
    category: "vetements",
    price: 15000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"
  },
  {
    id: 6,
    name: "Bracelet Maille Argent",
    category: "accessoires",
    price: 8500,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500"
  },
  {
    id: 7,
    name: "Lunettes de Soleil Minimal",
    category: "accessoires",
    price: 10000,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"
  }
];

// 2. CHARGEMENT DU PANIER DEPUIS LA MÉMOIRE DU NAVIGATEUR
let cart = JSON.parse(localStorage.getItem("rodis_cart")) || [];
let currentCategory = "tous";
let searchQuery = ""; // NOUVEAU : garde en mémoire ce que le client tape

// NOUVELLE FONCTION : Déclenchée à chaque lettre tapée
function handleSearch(value) {
  searchQuery = value.toLowerCase().trim();
  renderProducts();
}

// 3. AFFICHER LES PRODUITS À L'ÉCRAN (Catégorie + Recherche combinées)
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
    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between">
      <div>
        <img src="${product.image}" alt="${product.name}" class="w-full h-44 object-cover bg-stone-100">
        <div class="p-3">
          <h3 class="font-bold text-xs sm:text-sm text-stone-900 leading-tight h-8 flex items-center">${product.name}</h3>
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

// 4. FILTRER PAR CATÉGORIE
function filterCategory(category) {
  currentCategory = category;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    if (btn.dataset.cat === category) {
      btn.className = "cat-btn bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap";
    } else {
      btn.className = "cat-btn bg-stone-200 text-stone-700 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap";
    }
  });
  renderProducts();
}

// 5. AJOUTER UN ARTICLE AU PANIER
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveAndRefreshCart();
}

// 6. MODIFIER LA QUANTITÉ (+1 ou -1)
function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveAndRefreshCart();
}

// 7. SAUVEGARDER ET METTRE À JOUR L'AFFICHAGE DU PANIER
function saveAndRefreshCart() {
  localStorage.setItem("nova_cart", JSON.stringify(cart));

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  document.getElementById("cart-badge").textContent = totalCount;
  document.getElementById("cart-total").textContent = `${totalPrice.toLocaleString("fr-FR")} FCFA`;

  const container = document.getElementById("cart-items");
  if (cart.length === 0) {
    container.innerHTML = `<p class="text-center text-stone-400 text-sm py-12">Ton panier est vide pour le moment.</p>`;
  } else {
    container.innerHTML = cart.map(item => `
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
  }

  updateWhatsAppPreview();
}

// 8. OUVRIR / FERMER LE TIROIR DU PANIER
function toggleCart(show) {
  const modal = document.getElementById("cart-modal");
  modal.classList.toggle("hidden", !show);
}

// 9. GÉNÉRER LE MESSAGE WHATSAPP EN DIRECT
function buildWhatsAppMessage() {
  const name = document.getElementById("client-name").value.trim() || "Client";
  const address = document.getElementById("client-address").value.trim() || "Non précisé";
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) return "Ajoute un article pour voir l'aperçu du message WhatsApp...";

  const lines = cart.map(i => `• ${i.quantity}x ${i.name} (${(i.price * i.quantity).toLocaleString("fr-FR")} FCFA)`).join("\n");
  return `Bonjour Rodis STUDIO 👋\nJe souhaite passer commande :\n\n${lines}\n\n💰 *TOTAL : ${total.toLocaleString("fr-FR")} FCFA*\n👤 Client : ${name}\n📍 Livraison : ${address}`;
}

function updateWhatsAppPreview() {
  document.getElementById("whatsapp-preview").textContent = buildWhatsAppMessage();
}

// 10. ENVOYER LA COMMANDE SUR WHATSAPP
function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Ajoute au moins un article dans ton panier !");
    return;
  }
  const phone = document.getElementById("vendor-phone").value.replace(/\D/g, "");
  const message = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

// INITIALISATION AU DÉMARRAGE
renderProducts();
saveAndRefreshCart();