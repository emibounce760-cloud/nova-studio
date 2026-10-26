# RÈGLES D'ARCHITECTURE & CONTEXTE AGENT — RODIS STUDIO

## 1. Vue d'ensemble du projet
- **Nom :** Rodis STUDIO (Boutique Express WhatsApp en Marque Blanche)
- **URL Production :** https://emibounce760-cloud.github.io/nova-studio/
- **Objectif :** Permettre aux commerçants de publier des articles depuis leur téléphone et de recevoir les commandes formatées sur WhatsApp.

## 2. Stack Technique (Zéro Build / Ultra-léger)
- **Frontend :** HTML5 (`index.html`) + Tailwind CSS via CDN
- **Logique :** JavaScript Vanilla (`app.js`)
- **Base de données Cloud :** Supabase PostgreSQL (`https://ehicifgwmpyyaoxvzezw.supabase.co`)
- **Table SQL :** `products` (colonnes : `id`, `name`, `category`, `price`, `image`, `created_at`)

## 3. Règles strictes pour l'Agent IA
1. **Zéro dépendance complexe :** Ne jamais imposer de framework lourd tant que l'application tourne sur GitHub Pages en direct.
2. **Sécurité :** Ne jamais exposer de clé `sb_secret` dans le code frontend. Utiliser uniquement la clé publiable (`sb_publishable`).
3. **Performance Mobile :** Toute photo ajoutée depuis un téléphone doit être compressée via `<canvas>` (max 500px, JPEG 0.75) avant l'envoi vers Supabase.
4. **Configuration Client :** Toutes les informations du commerçant (Nom, WhatsApp, PIN, Slogan) doivent être centralisées dans l'objet `SHOP_CONFIG` en haut de `app.js`.