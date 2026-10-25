# Rita Compta — Luxe Vintage 🧥✨

Application web mobile-first & PWA sur-mesure pour la gestion d'inventaire, le rapprochement de catalogue Vinted et la comptabilité des ventes de pièces de luxe vintage.

Développée pour le dressing de Rita ([@nuzhdina.ri](https://www.vinted.fr/member/68815764-nuzhdinari)).

---

## ✨ Fonctionnalités Clés

- **🧥 Inventaire Actif & Suivi à la Pièce :**
  - Traçabilité individuelle de chaque pièce vintage (aucun lot en vrac).
  - Statut de rapprochement Vinted en temps réel (Pastille verte *En ligne Vinted* ou orange *Non rapprochée / Marché seul*).
  - Saisie rapide et modification du vrai prix d'achat payé (`0 €` / non renseigné par défaut, aucune donnée inventée).
  - Vente express en 1 clic (Vinted, Marché aux Puces, Instagram, Pop-up).

- **🤝 Synchronisation & Rapprochement Vinted Intelligent :**
  - Moteur de rapprochement flou (fuzzy matching sur titres, marques et catégories).
  - Intégration des **120 pièces réelles** du dressing de Rita avec photos officielles Vinted et prix affichés.
  - Bouton d'importation globale dans l'inventaire en 1 clic.

- **➕ Saisie Express Mobile (+ Capture Photo) :**
  - Prise de vue directe avec l'appareil photo du smartphone ou import de galerie.
  - Détection automatique de la correspondance dans le dressing Vinted dès la frappe du titre.
  - Pré-remplissage automatique des catégories, prix conseillés et marques.

- **📊 Tableau de Bord des Ventes Dédié :**
  - Métriques clés : Chiffre d'Affaires total, Marge Nette réelle, ROI global.
  - Comparatif des canaux de vente (Vinted vs Marchés / Direct).
  - Classement des marques les plus rentables.
  - Grand livre des ventes détaillées avec date, marge et mode de paiement.

- **📲 Installation PWA (Progressive Web App) :**
  - Installable directement sur iPhone (Safari > *Sur l'écran d'accueil*) et Android / PC.
  - Fonctionne hors-ligne sur les marchés grâce au Service Worker et au stockage local IndexedDB.
  - Menu burger responsive et ergonomie pensée pour l'utilisation à une main sur smartphone.

---

## 🛠️ Stack Technique

- **Framework :** React 18 + TypeScript + Vite
- **Base de Données Locale :** Dexie.js (IndexedDB persistant et réactif)
- **Design System :** Tailwind CSS — Direction artistique *Hôtel Drouot* (Cognac `#966A38`, papier d'archive `#F5F1EA`, Space Grotesk)
- **Icônes :** Lucide React
- **PWA :** Web App Manifest, Service Worker offline, Icônes multi-résolutions

---

## 🚀 Démarrage Rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur local
npm run dev

# Compiler pour la production
npm run build
```

---

## 📱 Utilisation Mobile (Sur le même réseau Wi-Fi)

1. Lancez `npm run dev -- --host`.
2. Ouvrez l'adresse IP locale affichée (ex: `http://192.168.1.115:3000`) sur le navigateur de votre smartphone.
3. Touchez **« Installer l'application »** pour l'ajouter à votre écran d'accueil comme une application native.
