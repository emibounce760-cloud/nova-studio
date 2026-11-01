const sb = supabase.createClient(
  "https://ehicifgwmpyyaoxvzezw.supabase.co",
  "sb_publishable_AJuaJ5zv3NZpOspUtVcZCg_6kIYGZRX"
);
const WA = "22893789708", PIN = "1234", SOLD = "[ÉPUISÉ] ";

const CATS = [
  ["tous", "Tout voir", "✨", "#FCEEF2"],
  ["glam_levres", "Gloss & Lèvres", "💄", "#FFE4E6"],
  ["glam_maquillage", "Teint & Palettes", "🎨", "#FDF1E8"],
  ["glam_soins", "Soins & Parfums", "🌸", "#E6F6F4"],
  ["glam_sacs", "Sacs, Talons & Coffrets", "👜", "#F3E8FF"],
  ["glam_accessoires", "Accessoires Beauté", "🪞", "#FEF3C7"]
];
const TYPES = ["À l'unité", "Offre Lot (ex: 3 à 5 000 F)", "En Gros / Revendeuse"];
const COLORS = ["Au choix sur photo", "Nude", "Chocolat", "Rose Glossy", "Rouge Matte", "Bordeaux", "Vert Olive", "Noir"];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const isSold = p => String(p.name || "").startsWith(SOLD);
const label = p => isSold(p) ? String(p.name).slice(SOLD.length) : String(p.name || "");
const isGlam = p => String(p.category || "").startsWith("glam_");
const find = id => products.find(p => String(p.id) === String(id));

let products = [], cat = "tous", query = "", admin = false, cur = null, newImg = "";
let opt = { type: TYPES[0], color: "" };
let cart = [];
try { cart = JSON.parse(localStorage.getItem("glam_cart")) || []; } catch (e) { cart = []; }
cart = cart.map(x => ({ type: TYPES[0], size: "Standard", color: COLORS[0], qty: 1, ...x }));

function show(id) {
  $(id).classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const box = id === "product-modal" ? $("pm-box") : id === "cart-modal" ? $("cart-box") : null;
  if (box && window.gsap) {
    gsap.fromTo(box, { y: 40, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" });
  }
}

function closeModal(id) {
  $(id).classList.add("hidden");
  document.body.style.overflow = "";
}

function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.remove("hidden");
  if (window.gsap) gsap.fromTo(t, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* ===== SCÈNE 3D TEMPS RÉEL (THREE.JS) ===== */
function init3D() {
  const canvas = $("hero-3d");
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 14;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambLight);

  const dirLight1 = new THREE.PointLight(0xe11d74, 2.2, 30);
  dirLight1.position.set(6, 6, 8);
  scene.add(dirLight1);

  const dirLight2 = new THREE.PointLight(0xffb6c1, 1.8, 30);
  dirLight2.position.set(-6, -4, 6);
  scene.add(dirLight2);

  const palette = [0xe11d74, 0xf472b6, 0xfbcfe8, 0xfde68a, 0xd97706];
  const spheres = [];
  const geo = new THREE.SphereGeometry(1, 32, 32);

  for (let i = 0; i < 16; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: palette[i % palette.length],
      roughness: 0.18,
      metalness: 0.35
    });
    const mesh = new THREE.Mesh(geo, mat);
    const scale = 0.35 + Math.random() * 0.85;
    mesh.scale.set(scale, scale, scale);
    mesh.position.set(
      (Math.random() - 0.25) * 14,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 5
    );
    mesh.userData = {
      speed: 0.008 + Math.random() * 0.012,
      offset: Math.random() * Math.PI * 2,
      baseY: mesh.position.y,
      baseX: mesh.position.x
    };
    scene.add(mesh);
    spheres.push(mesh);
  }

  let targetX = 0, targetY = 0;
  window.addEventListener("pointermove", e => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2.5;
    targetY = -(e.clientY / window.innerHeight - 0.5) * 2.5;
  });

  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    clock += 0.02;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    spheres.forEach(s => {
      s.position.y = s.userData.baseY + Math.sin(clock + s.userData.offset) * 0.65;
      s.rotation.x += s.userData.speed;
      s.rotation.y += s.userData.speed;
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    if (!canvas.clientWidth) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}

/* ===== ANIMATIONS GSAP & EFFET 3D TILT ===== */
function initHeroAnimations() {
  if (!window.gsap) return;
  const tl = gsap.timeline();
  tl.fromTo("#hero-badge", { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })
    .fromTo("#hero-title", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
    .fromTo("#hero-desc", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.2")
    .fromTo("#hero-btns a", { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.4 }, "-=0.2");
}


function animateGridCards() {
  if (!window.gsap) return;
  gsap.fromTo(".prod-card",
    { opacity: 0, y: 35, rotateX: 8, scale: 0.96 },
    { opacity: 1, y: 0, rotateX: 0, scale: 1, stagger: 0.06, duration: 0.45, ease: "power2.out" }
  );
  bindTilt();
}

function bindTilt() {
  document.querySelectorAll(".tilt-card").forEach(el => {
    el.onmousemove = e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-3px)`;
    };
    el.onmouseleave = () => {
      el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0px)";
    };
  });
}

/* ===== CATALOGUE & ISOLATION SUPABASE ===== */
async function loadProducts() {
  $("grid").innerHTML = '<p class="col-span-full text-center py-12 text-sm opacity-60">Chargement de la collection…</p>';
  const { data, error } = await sb.from("products").select("id,name,category,price,image,created_at").order("created_at", { ascending: false });
  if (error) {
    $("grid").innerHTML = `<p class="col-span-full text-center py-12 text-sm text-red-600">Erreur : ${esc(error.message)}</p>`;
    return;
  }
  products = (data || []).filter(isGlam);
  render();
}

function renderCats() {
  $("cat-bubbles").innerHTML = CATS.map(([k, l, icon, bg]) =>
    `<button type="button" onclick="setCat('${k}')" class="flex flex-col items-center gap-1.5 shrink-0 group">
      <div style="background:${bg}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition transform group-hover:scale-110 shadow-xs border-2 ${k === cat ? "border-brand ring-2 ring-pink-200" : "border-white"}">
        ${icon}
      </div>
      <span class="text-[11px] font-bold ${k === cat ? "text-brand" : "text-navy"} whitespace-nowrap">${l}</span>
    </button>`
  ).join("");

  $("cats").innerHTML = CATS.map(([k, l]) =>
    `<button type="button" onclick="setCat('${k}')" class="shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition ${k === cat ? "bg-brand text-white border-brand shadow-xs" : "bg-white text-navy border-gray-200 hover:border-brand"}">${l}</button>`
  ).join("");
}

function setCat(k) { cat = k; renderCats(); render(); }
function handleSearch(v) { query = v.trim().toLowerCase(); render(); }

function render() {
  const list = products.filter(p => (cat === "tous" || p.category === cat) && label(p).toLowerCase().includes(query));
  $("grid").innerHTML = list.length ? list.map(card).join("") : '<p class="col-span-full text-center py-12 text-sm opacity-60">Aucun article dans ce rayon pour le moment.</p>';
  animateGridCards();
}

function card(p, i) {
  const sold = isSold(p), id = esc(p.id);
  const badge = sold
    ? '<span class="bg-red-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">Out of Stock</span>'
    : (i % 2 === 0
      ? '<span class="bg-pastelMint text-teal-800 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">New</span>'
      : '<span class="bg-brand text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">Sale</span>');

  return `<div class="prod-card tilt-card bg-white rounded-3xl p-2.5 border border-gray-100 shadow-xs hover:shadow-xl flex flex-col">
    <button type="button" onclick="openProduct('${id}')" class="relative block w-full aspect-square rounded-2xl bg-blush overflow-hidden">
      <img src="${esc(p.image)}" alt="${esc(label(p))}" loading="lazy" class="w-full h-full object-cover transition duration-500 hover:scale-105 ${sold ? "grayscale opacity-65" : ""}">
      <div class="absolute top-2.5 left-2.5">${badge}</div>
      <span class="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-navy flex items-center justify-center text-xs shadow-xs">🔍</span>
    </button>
    <div class="pt-3 px-1.5 pb-1 flex flex-col items-center text-center gap-1 flex-1">
      <div class="text-amber-400 text-[11px] tracking-widest">★★★★★</div>
      <button type="button" onclick="openProduct('${id}')" class="font-semibold text-xs sm:text-sm text-navy leading-snug line-clamp-2">${esc(label(p))}</button>
      <p class="font-extrabold text-brand text-sm mt-0.5">${fmt(p.price)}</p>
      ${sold
        ? '<button type="button" disabled class="mt-auto w-full py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-400">Indisponible</button>'
        : `<button type="button" onclick="openProduct('${id}')" class="mt-auto w-full py-2 rounded-full text-xs font-bold bg-pastelPink text-brand hover:bg-brand hover:text-white transition">+ Choisir</button>`}
      ${admin ? `<div class="grid grid-cols-2 gap-1 w-full text-[11px] font-semibold pt-2">
        <button type="button" onclick="editPrice('${id}')" class="py-1.5 rounded-lg bg-gray-100">✏️ Prix</button>
        <button type="button" onclick="editName('${id}')" class="py-1.5 rounded-lg bg-gray-100">✏️ Nom</button>
        <button type="button" onclick="toggleStock('${id}')" class="py-1.5 rounded-lg bg-gray-100">🔄 Stock</button>
        <button type="button" onclick="deleteProduct('${id}')" class="py-1.5 rounded-lg bg-red-50 text-red-600">🗑️</button>
      </div>` : ""}
    </div>
  </div>`;
}

/* ===== OPTIONS & PANIER ===== */
const pill = (txt, on, fn) =>
  `<button type="button" onclick="${fn}" class="px-3 py-2 rounded-full text-xs font-bold border transition ${on ? "bg-brand text-white border-brand" : "bg-white text-navy border-gray-300"}">${txt}</button>`;

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
  $("o-size").value = "Standard"; $("o-color").value = "";
  $("pm-opts").classList.toggle("hidden", sold);
  const b = $("pm-add");
  b.disabled = sold;
  b.textContent = sold ? "Indisponible" : "+ Ajouter au Panier";
  b.className = "w-full py-3.5 rounded-full font-bold text-base " + (sold ? "bg-gray-300 text-gray-500" : "bg-brand text-white shadow-lg");
  renderOpts(); show("product-modal");
}

const total = () => cart.reduce((s, l) => s + l.price * l.qty, 0);
const lineKey = l => [l.id, l.type, l.size, String(l.color).toLowerCase()].join("|");
function saveCart() {
  try { localStorage.setItem("glam_cart", JSON.stringify(cart)); } catch (e) {}
  $("cart-count").textContent = cart.reduce((s, l) => s + l.qty, 0);
}

function addToCart() {
  if (!cur || isSold(cur)) return;
  const l = { id: cur.id, name: label(cur), price: Number(cur.price) || 0, qty: 1, type: opt.type, size: $("o-size").value, color: opt.color.trim() || COLORS[0] };
  const e = cart.find(x => lineKey(x) === lineKey(l));
  if (e) e.qty++; else cart.push(l);
  saveCart(); closeModal("product-modal"); toast("Ajouté au panier ✨");
  if (window.gsap) gsap.fromTo("#btn-cart", { scale: 1.2 }, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
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
    <p class="text-xs text-brand font-medium">${esc(l.type)} · ${esc(l.size)} · Teinte/Couleur : ${esc(l.color)}</p>
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
    `${i + 1}. *${l.name}*\n   • ${l.type}\n   • Format : ${l.size} • Teinte/Couleur : ${l.color}\n   • ${l.qty} x ${fmt(l.price)} = ${fmt(l.price * l.qty)}`
  ).join("\n\n");
  return `💄 *Nouvelle commande — Emma Beauty Makeup*\n\n👤 Prénom : ${n}\n📍 Quartier/Ville : ${z}\n\n${lines}\n\n💰 *Total : ${fmt(total())}*\n\nMerci de confirmer la disponibilité 🙏`;
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
    const v = prompt("Code vendeuse Emma :");
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
  const v = prompt("Nom de l'article :", label(p));
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

$("a-cat").innerHTML = CATS.filter(c => c[0] !== "tous").map(([k, l]) => `<option value="${k}">${l}</option>`).join("");
renderCats();
saveCart();
init3D();
initHeroAnimations();
bindTilt();
loadProducts();