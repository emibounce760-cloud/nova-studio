/* ===== LINDA FASHION — app.js ===== */
const sb = supabase.createClient(
  "https://ehicifgwmpyyaoxvzezw.supabase.co",
  "sb_publishable_AJuaJ5zv3NZpOspUtVcZCg_6kIYGZRX"
);
const WA = "22893746561", PIN = "1234", SOLD = "[ÉPUISÉ] ";
const CATS = [
  ["tous", "Tous les Arrivages"], ["vetements", "Robes Chic"],
  ["accessoires", "Ensembles 2 Pièces"], ["sacs", "Crop Tops (Gros & Détail)"],
  ["chaussures", "Accessoires"]
];
const TYPES = ["Au Détail", "En Gros (Lot / Revendeur)"];
const COLORS = ["Au choix sur photo", "Noir", "Blanc", "Rose", "Vert", "Bleu", "Multicolore"];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const isSold = p => String(p.name || "").startsWith(SOLD);
const label = p => isSold(p) ? String(p.name).slice(SOLD.length) : String(p.name || "");
const find = id => products.find(p => String(p.id) === String(id));
const show = id => { $(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; };
const closeModal = id => { $(id).classList.add("hidden"); document.body.style.overflow = ""; };

let products = [], cat = "tous", query = "", admin = false, cur = null, newImg = "";
let opt = { type: TYPES[0], color: "" };
let cart = [];
try { cart = JSON.parse(localStorage.getItem("nova_cart")) || []; } catch (e) { cart = []; }
cart = cart.map(x => ({ type: TYPES[0], size: "Unique", color: COLORS[0], qty: 1, ...x }));

function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2000);
}

/* ===== PRODUITS ===== */
async function loadProducts() {
  $("grid").innerHTML = '<p class="col-span-full text-center py-10 text-sm opacity-60">Chargement…</p>';
  const { data, error } = await sb.from("products").select("id,name,category,price,image,created_at").order("created_at", { ascending: false });
  if (error) {
    $("grid").innerHTML = `<p class="col-span-full text-center py-10 text-sm text-red-600">Erreur de chargement : ${esc(error.message)}</p>`;
    return;
  }
  products = data || [];
  render();
}

function renderCats() {
  $("cats").innerHTML = CATS.map(([k, l]) =>
    `<button type="button" onclick="setCat('${k}')" class="shrink-0 px-4 py-2 rounded-full text-xs font-semibold border ${k === cat ? "bg-brand text-white border-brand" : "bg-white text-navy border-gray-200"}">${l}</button>`
  ).join("");
}
function setCat(k) { cat = k; renderCats(); render(); }
function handleSearch(v) { query = v.trim().toLowerCase(); render(); }

function render() {
  const list = products.filter(p => (cat === "tous" || p.category === cat) && label(p).toLowerCase().includes(query));
  $("grid").innerHTML = list.length ? list.map(card).join("") : '<p class="col-span-full text-center py-10 text-sm opacity-60">Aucun article trouvé.</p>';
}

function card(p) {
  const sold = isSold(p), id = esc(p.id);
  return `<div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
    <button type="button" onclick="openProduct('${id}')" class="relative block w-full aspect-[3/4] bg-blush">
      <img src="${esc(p.image)}" alt="${esc(label(p))}" loading="lazy" class="w-full h-full object-cover ${sold ? "grayscale opacity-70" : ""}">
      ${sold
        ? '<span class="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-700 text-white text-[11px] font-bold text-center py-2 px-1">Victime de son succès • Épuisé</span>'
        : '<span class="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-full">Nouvel Arrivage</span>'}
      <span class="absolute bottom-2 right-2 bg-white/90 text-navy text-[10px] font-semibold px-2 py-1 rounded-full">🔍 Voir de près</span>
    </button>
    <div class="p-3 flex flex-col gap-2 flex-1">
      <button type="button" onclick="openProduct('${id}')" class="text-left font-semibold text-sm leading-tight">${esc(label(p))}</button>
      <p class="font-bold text-brand text-sm">${fmt(p.price)}</p>
      ${sold
        ? '<button type="button" disabled class="mt-auto w-full py-2 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">Indisponible</button>'
        : `<button type="button" onclick="openProduct('${id}')" class="mt-auto w-full py-2 rounded-full text-xs font-semibold bg-brand text-white">+ Commander</button>`}
      ${admin ? `<div class="grid grid-cols-2 gap-1 text-[11px] font-semibold">
        <button type="button" onclick="editPrice('${id}')" class="py-2 rounded-lg bg-gray-100">✏️ Prix</button>
        <button type="button" onclick="editName('${id}')" class="py-2 rounded-lg bg-gray-100">✏️ Nom</button>
        <button type="button" onclick="toggleStock('${id}')" class="py-2 rounded-lg bg-gray-100">🔄 Stock</button>
        <button type="button" onclick="deleteProduct('${id}')" class="py-2 rounded-lg bg-red-50 text-red-600">🗑️</button>
      </div>` : ""}
    </div>
  </div>`;
}

/* ===== MODALE ZOOM + OPTIONS ===== */
const pill = (txt, on, fn) =>
  `<button type="button" onclick="${fn}" class="px-3 py-2 rounded-full text-xs font-semibold border ${on ? "bg-brand text-white border-brand" : "bg-white text-navy border-gray-300"}">${txt}</button>`;

function renderOpts() {
  $("p-type").innerHTML = TYPES.map((t, i) => pill(t, opt.type === t, `setType(${i})`)).join("");
  $("p-color").innerHTML = COLORS.map((c, i) => pill(c, opt.color === c, `setColor(${i})`)).join("");
}
function setType(i) { opt.type = TYPES[i]; renderOpts(); }
function setColor(i) { opt.color = COLORS[i]; $("o-color").value = COLORS[i]; renderOpts(); }
function onColor(v) { opt.color = v; renderOpts(); }

function openProduct(id) {
  cur = find(id); if (!cur) return;
  const sold = isSold(cur);
  opt = { type: TYPES[0], color: "" };
  $("pm-img").src = cur.image;
  $("pm-name").textContent = label(cur);
  $("pm-price").textContent = fmt(cur.price);
  $("o-size").value = "Unique"; $("o-color").value = "";
  $("pm-opts").classList.toggle("hidden", sold);
  const b = $("pm-add");
  b.disabled = sold;
  b.textContent = sold ? "Indisponible" : "+ Ajouter au Panier";
  b.className = "w-full py-3 rounded-full font-semibold text-base " + (sold ? "bg-gray-300 text-gray-500" : "bg-brand text-white");
  renderOpts(); show("product-modal");
}

/* ===== PANIER ===== */
const total = () => cart.reduce((s, l) => s + l.price * l.qty, 0);
const lineKey = l => [l.id, l.type, l.size, String(l.color).toLowerCase()].join("|");
function saveCart() {
  try { localStorage.setItem("nova_cart", JSON.stringify(cart)); } catch (e) {}
  $("cart-count").textContent = cart.reduce((s, l) => s + l.qty, 0);
}

function addToCart() {
  if (!cur || isSold(cur)) return;
  const l = { id: cur.id, name: label(cur), price: Number(cur.price) || 0, qty: 1, type: opt.type, size: $("o-size").value, color: opt.color.trim() || COLORS[0] };
  const e = cart.find(x => lineKey(x) === lineKey(l));
  if (e) e.qty++; else cart.push(l);
  saveCart(); closeModal("product-modal"); toast("Ajouté au panier ✓");
}
function chQty(i, d) { cart[i].qty += d; if (cart[i].qty < 1) cart.splice(i, 1); saveCart(); renderCart(); }
function rmLine(i) { cart.splice(i, 1); saveCart(); renderCart(); }
function openCart() { renderCart(); show("cart-modal"); }

function renderCart() {
  const empty = !cart.length;
  $("cart-empty").classList.toggle("hidden", !empty);
  $("cart-body").classList.toggle("hidden", empty);
  $("cart-items").innerHTML = cart.map((l, i) => `<div class="py-3 border-b">
    <div class="flex justify-between gap-2">
      <p class="font-semibold text-sm">${esc(l.name)}</p>
      <button type="button" onclick="rmLine(${i})" class="text-sm">🗑️</button>
    </div>
    <p class="text-xs text-brand font-medium">${esc(l.type)} · Taille ${esc(l.size)} · ${esc(l.color)}</p>
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-3">
        <button type="button" onclick="chQty(${i},-1)" class="w-8 h-8 rounded-full border">−</button>
        <span class="font-semibold">${l.qty}</span>
        <button type="button" onclick="chQty(${i},1)" class="w-8 h-8 rounded-full border">+</button>
      </div>
      <span class="font-bold text-sm">${fmt(l.price * l.qty)}</span>
    </div>
  </div>`).join("");
  $("cart-total").textContent = fmt(total());
  buildPreview();
}

function buildMsg() {
  const n = $("c-name").value.trim() || "…", z = $("c-zone").value.trim() || "…";
  const lines = cart.map((l, i) =>
    `${i + 1}. *${l.name}*\n   • ${l.type}\n   • Taille : ${l.size} • Couleur : ${l.color}\n   • ${l.qty} x ${fmt(l.price)} = ${fmt(l.price * l.qty)}`
  ).join("\n\n");
  return `🛍️ *Nouvelle commande — Linda Fashion*\n\n👤 Prénom : ${n}\n📍 Quartier/Ville : ${z}\n\n${lines}\n\n💰 *Total : ${fmt(total())}*\n\nMerci de confirmer la disponibilité et le prix gros/détail 🙏`;
}
function buildPreview() { $("c-preview").textContent = buildMsg(); }

function sendWA() {
  if (!cart.length) return;
  if (!$("c-name").value.trim() || !$("c-zone").value.trim()) return alert("Merci d'indiquer votre prénom et votre quartier / ville.");
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(buildMsg())}`, "_blank");
}

/* ===== ADMIN ===== */
function unlockAdmin() {
  if (admin) admin = false;
  else {
    const v = prompt("Code vendeur :");
    if (v === null) return;
    if (v !== PIN) return alert("Code incorrect.");
    admin = true;
  }
  $("btn-add").classList.toggle("hidden", !admin);
  $("btn-lock").textContent = admin ? "🔓" : "🔒";
  render();
}

async function upd(p, fields, msg) {
  const { error } = await sb.from("products").update(fields).eq("id", p.id);
  if (error) return alert("Erreur : " + error.message);
  toast(msg); loadProducts();
}

function editPrice(id) {
  const p = find(id); if (!p) return;
  const v = prompt("Nouveau prix (FCFA) :", p.price);
  if (v === null) return;
  const n = parseInt(String(v).replace(/\D/g, ""), 10);
  if (!n) return alert("Prix invalide.");
  upd(p, { price: n }, "Prix mis à jour ✓");
}

function editName(id) {
  const p = find(id); if (!p) return;
  const v = prompt("Nom du modèle (ex : Robe Satin — Gros: 2500F / Détail: 3000F) :", label(p));
  if (v === null) return;
  const n = v.replace(SOLD.trim(), "").trim();
  if (!n) return alert("Le nom ne peut pas être vide.");
  upd(p, { name: (isSold(p) ? SOLD : "") + n }, "Nom mis à jour ✓");
}

function toggleStock(id) {
  const p = find(id); if (!p) return;
  upd(p, { name: isSold(p) ? label(p) : SOLD + label(p) }, isSold(p) ? "Remis en stock ✓" : "Marqué épuisé ✓");
}

async function deleteProduct(id) {
  const p = find(id); if (!p) return;
  if (!confirm("Supprimer « " + label(p) + " » définitivement ?")) return;
  const { error } = await sb.from("products").delete().eq("id", p.id);
  if (error) return alert("Erreur : " + error.message);
  toast("Article supprimé"); loadProducts();
}

function openAdmin() {
  newImg = "";
  ["a-name", "a-price", "a-file"].forEach(i => $(i).value = "");
  $("a-prev").classList.add("hidden");
  show("admin-modal");
}

function pickPhoto(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const w = Math.min(600, im.width), h = Math.round(im.height * w / im.width);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(im, 0, 0, w, h);
      newImg = c.toDataURL("image/jpeg", 0.8);
      $("a-prev").src = newImg; $("a-prev").classList.remove("hidden");
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
}

async function addNewProduct() {
  const name = $("a-name").value.trim(), price = parseInt($("a-price").value, 10), category = $("a-cat").value;
  if (!name || !price || !newImg) return alert("Nom, prix et photo sont obligatoires.");
  const btns = document.querySelectorAll(".pub");
  btns.forEach(b => b.disabled = true);
  const { error } = await sb.from("products").insert([{ name, category, price, image: newImg }]);
  btns.forEach(b => b.disabled = false);
  if (error) return alert("Erreur : " + error.message);
  closeModal("admin-modal"); toast("Article publié ✓"); loadProducts();
}

/* ===== INIT ===== */
$("a-cat").innerHTML = CATS.filter(c => c[0] !== "tous").map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
renderCats(); saveCart(); loadProducts();