# CONTEXTE AGENT — BOUTIQUE #2 : GLAM BEAUTÉ & SACS (/glam)

## 1. Identité & Positionnement
- **Dossier :** `/nova-studio/glam/`
- **Produits :** Gloss, rouges à lèvres, baumes à lèvres et sacs à main pour femme.
- **Palette Tailwind :** Rose Nude/Framboise (`brand`), Noir Chic (`navy`), Fond Crème Rosé (`blush`).

## 2. Règle Critique d'Isolation Supabase (Multi-Tenancy)
- Ce site partage la table Supabase `products` avec la boutique racine.
- **RÈGLE ABSOLUE :** Toutes les catégories de cette boutique DOIVENT commencer par le préfixe `glam_` :
  - `glam_gloss` ("Gloss & Brillants")
  - `glam_levres` ("Rouges à Lèvres")
  - `glam_baumes` ("Baumes & Soins")
  - `glam_sacs` ("Sacs à Main")
- Dans `loadProducts()` ou `render()`, filtrer systématiquement les produits pour n'afficher QUE ceux dont `p.category` commence par `glam_`.
- Clé `localStorage` du panier : utiliser `glam_cart` (et non `nova_cart`) pour éviter tout conflit de panier.