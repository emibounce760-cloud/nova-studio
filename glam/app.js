/* ===== LINDA FASHION — EDITION BECANE PARIS (app.js) ===== */
const sb = supabase.createClient(
  "https://ehicifgwmpyyaoxvzezw.supabase.co",
  "sb_publishable_AJuaJ5zv3NZpOspUtVcZCg_6kIYGZRX"
);
const WA = "22893746561", PIN = "1234", SOLD = "[ÉPUISÉ] ";
const CATS = [
  ["tous", "Tous les Arrivages"],
  ["vetements", "Robes Chic"],
  ["accessoires", "Ensembles 2 Pièces"],
  ["sacs", "Crop Tops (Gros & Détail)"],
  ["chaussures", "Accessoires"]
];
const TYPES = ["Au Détail", "En Gros (Lot / Revendeur)"];
const COLORS = ["Au choix sur photo", "Noir", "Blanc", "Rose", "Vert", "Bleu", "Multicolore"];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const pad = n => String(n).padStart(2, "0");
const isSold = p => String(p.name || "").startsWith(SOLD);
const label = p => isSold(p) ? String(p.name).slice(SOLD.length) : String(p.name || "");
const find = id => products.find(p => String(p.id) === String(id));
const show = id => { $(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; };
const closeModal = id => { $(id).classList.add("hidden"); document.body.style.overflow = ""; };

let products = [], filteredList = [], cat = "tous", query = "", admin = false, cur = null, newImg = "";
let opt = { type: TYPES[0], color: "" };
let cart = [];
try { cart = JSON.parse(localStorage.getItem("nova_cart")) || []; } catch (e) { cart = []; }
cart = cart.map(x => ({ type: TYPES[0], size: "Unique", color: COLORS[0], qty: 1, ...x }));

function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* ===== CHARGEMENT & ISOLATION MULTI-TENANCY ===== */
async function loadProducts() {
  $("grid").innerHTML = '<p class="col-span-full text-center py-12 font-mono text-xs uppercase tracking-widest opacity-60">CHARGEMENT DU LOOKBOOK…</p>';
  const { data, error } = await sb.from("products").select("id,name,category,price,image,created_at").order("created_at", { ascending: false });
  if (error) {
    $("grid").innerHTML = `<p class="col-span-full text-center py-12 font-mono text-xs text-red-600">ERREUR : ${esc(error.message)}</p>`;
    return;
  }
  // Ignore les produits de la boutique #2 (préfixe glam_)
  products = (data || []).filter(p => !String(p.category || "").startsWith("glam_"));
  render();
}

function renderCats() {
  $("cats").innerHTML = CATS.map(([k, l]) =>
    `<button type="button" onclick="setCat('${k}')" class="shrink-0 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold border transition ${k === cat ? "bg-carbon text-white border-carbon" : "bg-white text-black border-black/20 hover:border-black"}">${l}</button>`
  ).join("");
}
function setCat(k) { cat = k; renderCats(); render(); }
function handleSearch(v) { query = v.trim().toLowerCase(); render(); }

function render() {
  filteredList = products.filter(p => (cat === "tous" || p.category === cat) && label(p).toLowerCase().includes(query));
  if ($("prod-count")) $("prod-count").textContent = `PRODUCTS [${pad(filteredList.length)}]`;
  $("grid").innerHTML = filteredList.length
    ? filteredList.map((p, idx) => card(p, idx)).join("")
    : '<p class="col-span-full text-center py-12 font-mono text-xs uppercase tracking-widest opacity-50">AUCUN MODÈLE TROUVÉ.</p>';
}

function card(p, idx) {
  const sold = isSold(p), id = esc(p.id), lookNum = pad(idx + 1);
  return `<div class="bg-white border border-black/15 flex flex-col justify-between group">
    <div>
      <!-- EN-TÊTE CARTE STYLE BECANE PARIS -->
      <div class="flex items-center justify-between px-2.5 py-1.5 border-b border-black/10 font-mono text-[9px] uppercase tracking-widest">
        <span class="font-bold text-zinc-500">LOOK ${lookNum}</span>
        ${sold
          ? '<span class="bg-red-700 text-white px-1.5 py-0.5 font-bold">ÉPUISÉ</span>'
          : '<span class="text-brand font-bold">● DISPO</span>'}
      </div>

      <!-- PHOTO PRODUIT -->
      <button type="button" onclick="openProduct('${id}')" class="relative block w-full aspect-[3/4] bg-studio overflow-hidden">
        <img src="${esc(p.image)}" alt="${esc(label(p))}" loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover:scale-105 ${sold ? "grayscale opacity-65" : ""}">
        ${sold ? '<span class="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-700/95 text-white font-mono text-[10px] uppercase tracking-widest font-bold text-center py-2 px-1">VICTIME DE SON SUCCÈS • ÉPUISÉ</span>' : ""}
        <span class="absolute bottom-2 right-2 bg-white/95 border border-black/20 text-black font-mono text-[9px] uppercase tracking-wider font-bold px-2 py-1">🔍 FICHE</span>
      </button>
    </div>

    <!-- PIED DE CARTE -->
    <div class="p-3 flex flex-col gap-2 border-t border-black/10">
      <button type="button" onclick="openProduct('${id}')" class="text-left font-display font-bold text-xs sm:text-sm uppercase tracking-tight leading-snug line-clamp-2">${esc(label(p))}</button>
      <p class="font-mono font-bold text-brand text-xs sm:text-sm">${fmt(p.price)}</p>
      ${sold
        ? '<button type="button" disabled class="w-full py-2 font-mono text-[10px] uppercase tracking-widest font-bold bg-zinc-200 text-zinc-500">INDISPONIBLE</button>'
        : `<button type="button" onclick="openProduct('${id}')" class="w-full py-2 font-mono text-[10px] uppercase tracking-widest font-bold bg-carbon text-white hover:bg-brand transition">+ COMMANDER</button>`}
      ${admin ? `<div class="grid grid-cols-2 gap-1 pt-1 font-mono text-[10px] font-bold">
        <button type="button" onclick="editPrice('${id}')" class="py-1.5 border border-black/20 bg-studio">✏️ PRIX</button>
        <button type="button" onclick="editName('${id}')" class="py-1.5 border border-black/20 bg-studio">✏️ NOM</button>
        <button type="button" onclick="toggleStock('${id}')" class="py-1.5 border border-black/20 bg-studio">🔄 STOCK</button>
        <button type="button" onclick="deleteProduct('${id}')" class="py-1.5 border border-red-300 bg-red-50 text-red-700">🗑️</button>
      </div>` : ""}
    </div>
  </div>`;
}

/* ===== MODALE FICHE TECHNIQUE + NAVIGATION LOOKS ===== */
const pill = (txt, on, fn) =>
  `<button type="button" onclick="${fn}" class="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold border ${on ? "bg-carbon text-white border-carbon" : "bg-white text-black border-black/25"}">${txt}</button>`;

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
  const idx = filteredList.findIndex(p => String(p.id) === String(cur.id));
  opt = { type: TYPES[0], color: "" };
  $("pm-look").textContent = `LOOK ${pad(idx >= 0 ? idx + 1 : 1)} / ${pad(filteredList.length || 1)}`;
  $("pm-ref").textContent = `REF // LF-${String(cur.id).slice(-4).toUpperCase()}`;
  $("pm-img").src = cur.image;
  $("pm-name").textContent = label(cur);
  $("pm-price").textContent = fmt(cur.price);
  $("o-size").value = "Unique"; $("o-color").value = "";
  $("pm-opts").classList.toggle("hidden", sold);
  const b = $("pm-add");
  b.disabled = sold;
  b.textContent = sold ? "INDISPONIBLE" : "+ AJOUTER AU PANIER";
  b.className = "w-full py-3.5 font-mono uppercase tracking-widest font-bold text-base " + (sold ? "bg-zinc-300 text-zinc-500" : "bg-brand text-white");
  renderOpts(); show("product-modal");
}

function stepProduct(dir) {
  if (!cur || !filteredList.length) return;
  const idx = filteredList.findIndex(p => String(p.id) === String(cur.id));
  const nextIdx = (idx + dir + filteredList.length) % filteredList.length;
  openProduct(filteredList[nextIdx].id);
}

/* ===== PANIER WHATSAPP ===== */
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
  saveCart(); closeModal("product-modal"); toast("AJOUTÉ AU PANIER ✓");
}
function chQty(i, d) { cart[i].qty += d; if (cart[i].qty < 1) cart.splice(i, 1); saveCart(); renderCart(); }
function rmLine(i) { cart.splice(i, 1); saveCart(); renderCart(); }
function openCart() { renderCart(); show("cart-modal"); }

function renderCart() {
  const empty = !cart.length;
  $("cart-empty").classList.toggle("hidden", !empty);
  $("cart-body").classList.toggle("hidden", empty);
  $("cart-items").innerHTML = cart.map((l, i) => `<div class="py-3 border-b border-black/15">
    <div class="flex justify-between gap-2">
      <p class="font-display font-bold text-sm uppercase">${esc(l.name)}</p>
      <button type="button" onclick="rmLine(${i})" class="text-xs font-mono">✕</button>
    </div>
    <p class="font-mono text-[10px] text-brand font-bold uppercase mt-0.5">${esc(l.type)} · TAILLE ${esc(l.size)} · ${esc(l.color)}</p>
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-2 font-mono">
        <button type="button" onclick="chQty(${i},-1)" class="w-7 h-7 border border-black/30 font-bold">−</button>
        <span class="font-bold text-xs px-1">${l.qty}</span>
        <button type="button" onclick="chQty(${i},1)" class="w-7 h-7 border border-black/30 font-bold">+</button>
      </div>
      <span class="font-mono font-bold text-xs">${fmt(l.price * l.qty)}</span>
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

/* ===== MODE ADMIN VENDEUSE ===== */
function unlockAdmin() {
  if (admin) admin = false;
  else {
    const v = prompt("Code vendeur Linda :");
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
  upd(p, { price: n }, "PRIX MIS À JOUR ✓");
}

function editName(id) {
  const p = find(id); if (!p) return;
  const v = prompt("Nom du modèle (ex : Robe Satin — Gros: 2500F / Détail: 3000F) :", label(p));
  if (v === null) return;
  const n = v.replace(SOLD.trim(), "").trim();
  if (!n) return alert("Le nom ne peut pas être vide.");
  upd(p, { name: (isSold(p) ? SOLD : "") + n }, "NOM MIS À JOUR ✓");
}

function toggleStock(id) {
  const p = find(id); if (!p) return;
  upd(p, { name: isSold(p) ? label(p) : SOLD + label(p) }, isSold(p) ? "REMIS EN STOCK ✓" : "MARQUÉ ÉPUISÉ ✓");
}

async function deleteProduct(id) {
  const p = find(id); if (!p) return;
  if (!confirm("Supprimer « " + label(p) + " » définitivement ?")) return;
  const { error } = await sb.from("products").delete().eq("id", p.id);
  if (error) return alert("Erreur : " + error.message);
  toast("ARTICLE SUPPRIMÉ"); loadProducts();
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
  closeModal("admin-modal"); toast("ARTICLE PUBLIÉ ✓"); loadProducts();
}

/* ===== INITIALISATION ===== */
$("a-cat").innerHTML = CATS.filter(c => c[0] !== "tous").map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
renderCats(); saveCart(); loadProducts();