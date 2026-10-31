# CONTEXTE AGENT — BOUTIQUE #1 : LINDA FASHION (RACINE)

## 1. Architecture & Multi-Tenancy
- **Dossier :** Racine `/nova-studio` (Client : Linda Fashion, Adétikopé)
- **Sous-dossiers :** `/glam` héberge la Boutique #2 (Cosmétiques & Sacs). Ne jamais modifier `/glam` lors d'une intervention sur Linda Fashion.
- **Stack :** HTML5 (`index.html`), Tailwind CDN (couleurs `brand: #D81B60`, `navy: #1E295B`, `blush: #FFF7FA`), Vanilla JS (`app.js`), Supabase.

## 2. Règles Base de Données Supabase (Table `products`)
- **Colonnes fixes :** `id`, `name`, `category`, `price`, `image`, `created_at` (Zéro migration SQL).
- **Isolation des catégories Linda Fashion :** Utiliser uniquement `vetements`, `accessoires`, `sacs`, `chaussures`. Ignorer toute catégorie commençant par `glam_`.
- **Gestion de stock :** Préfixe `[ÉPUISÉ] ` au début de `name` via `toggleStock(id)`.

## 3. Fonctionnalités & DOM IDs Actifs
- **Grille & Filtres :** `#cats` (catégories), `#grid` (cartes produits), recherche instantanée `handleSearch()`.
- **Modale Options (`#product-modal`) :** Sélection Type (`Au Détail` / `En Gros`), Taille (`#o-size`) et Couleur (`#p-color` / `#o-color`).
- **Panier (`#cart-modal`) :** Stockage `localStorage` (`nova_cart`), aperçu `#c-preview` et envoi WhatsApp vers `22893746561`.
- **Admin (`#admin-modal`) :** PIN `1234`, compression photo `<canvas>` 600px JPEG 0.8, édition prix (`editPrice`), nom (`editName`) et stock (`toggleStock`).