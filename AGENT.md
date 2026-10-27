# RÈGLES D'ARCHITECTURE & CONTEXTE AGENT — NOVA STUDIO (MARQUE BLANCHE)

## 1. Vue d'ensemble du projet
- **Moteur :** Catalogue E-Commerce Express WhatsApp en Marque Blanche (`nova-studio`)
- **URL Production :** https://emibounce760-cloud.github.io/nova-studio/
- **Client Actif (Démo en cours) :** Linda Fashion (Prêt-à-Porter & Accessoires, Gros & Détail, Adétikopé)
- **Objectif :** Permettre aux clientes de zoomer sur les modèles ("Vue Écrin"), filtrer par catégorie, contacter la boutique (TikTok, WhatsApp, Appel, Email) et envoyer leur panier chiffré sur WhatsApp.

## 2. Stack Technique (Zéro Build / Ultra-léger)
- **Frontend :** HTML5 (`index.html`) + Tailwind CSS via CDN + Logo local (`logo.jpg` avec fallback automatique)
- **Logique :** JavaScript Vanilla (`app.js` avec versionning anti-cache `?v=4`)
- **Base de données Cloud :** Supabase PostgreSQL (`https://ehicifgwmpyyaoxvzezw.supabase.co`)
- **Table SQL :** `products` (colonnes : `id`, `name`, `category`, `price`, `image`, `created_at`)

## 3. Fonctionnalités Vendeur (CRUD Complet)
- **Accès sécurisé :** Bouton `🔒 Accès Linda` déverrouillable par code PIN (`SHOP_CONFIG.adminPin`).
- **Create :** Ajout d'article avec sélection photo depuis la galerie téléphone et compression automatique `<canvas>` (max 600px, JPEG 0.8).
- **Read :** Chargement temps réel depuis Supabase + recherche instantanée + filtres catégories.
- **Update :** Modification rapide du prix en direct via le bouton `✏️ Prix` (`editPrice`).
- **Delete :** Suppression d'article en 1 clic via le bouton `🗑️` (`deleteProduct`).

## 4. Design System Actif — Thème "Linda Fashion"
- **Palette :** Rose Fuchsia (`#D81B60`), Bleu Marine (`#1E295B`), Fond Rose Poudré (`#FFF7FA`).
- **Typographie :** Titres en `Cormorant Garamond` (italic bold), interface en `Montserrat`.
- **Réseaux & Contacts intégrés :** TikTok (`@lindafashion-officiel`), WhatsApp (`22893746561`), Appels (`93 74 65 61` / `90 84 58 13` / `96 79 60 96`), Email (`gbengbertanelynda@gmail.com`).

## 5. Règles strictes pour l'Agent IA
1. Ne jamais exposer de clé `sb_secret` dans le frontend (utiliser uniquement `sb_publishable`).
2. Toujours utiliser de vrais `<button type="button">` sur les zones cliquables des cartes produits pour garantir la compatibilité tactile sur iPhone (Safari iOS).
3. Centraliser les textes et numéros du commerçant dans `SHOP_CONFIG` en haut de `app.js`.