# Kozha — Vintage Luxury

Mobile-first web application and PWA for luxury vintage fashion resellers. Features individual piece tracking, real-time Vinted wardrobe reconciliation, and sales accounting.

Built for Rita's vintage archive ([@nuzhdina.ri](https://www.vinted.fr/member/68815764-nuzhdinari)).

---

## Core Features

- **Active Inventory & Piece-by-Piece Tracking:**
  - Individual piece traceability (no bulk lots).
  - Real-time Vinted listing match indicator (Online on Vinted vs Unmatched / In-person only).
  - Explicit purchase cost entry (0 EUR / unset by default; zero mock or invented data).
  - 1-click express sale modal (Vinted, Flea Market, Pop-up, Direct).

- **Intelligent Vinted Synchronization & Reconciliation:**
  - Fuzzy matching algorithm on titles, brands, and categories.
  - Direct integration with 120 verified pieces from Rita's public wardrobe with official photos and listing prices.
  - 1-click bulk import into active stock.

- **Mobile Express Purchase Entry (+ Photo Capture):**
  - Smartphone camera capture or photo gallery upload.
  - Automatic suggestion and detection of matching wardrobe listings while typing.
  - Auto-filling of suggested categories, brands, and price targets.

- **Dedicated Sales Accounting Dashboard:**
  - Key financial metrics: Total Revenue, Realized Net Margin, Overall ROI.
  - Sales channel comparison (Vinted vs Flea Markets / In-person).
  - Top brands ranking by profitability.
  - Certified detailed sales ledger with turnover duration and payment methods.

- **Progressive Web App (PWA):**
  - Installable directly on iOS (Safari > "Add to Home Screen"), Android (Chrome), and Desktop.
  - Offline mode support for flea markets and trade shows via Service Worker and IndexedDB.
  - Responsive mobile burger navigation designed for single-hand mobile usage.

---

## Technical Stack

- **Framework:** React 18 + TypeScript + Vite
- **Local Database:** Dexie.js (Reactive IndexedDB)
- **Design System:** Tailwind CSS — Hôtel Drouot aesthetic (Cognac `#966A38`, archival canvas `#F5F1EA`, Space Grotesk typography)
- **Icons:** Lucide React
- **PWA:** Web App Manifest, offline Service Worker, multi-resolution icons

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Mobile Usage (Same Wi-Fi Network)

1. Run `npm run dev -- --host`.
2. Open the local IP address (e.g. `http://192.168.1.115:3000`) on your mobile browser.
3. Tap **"Install on Device"** to add Kozha to your home screen as a standalone app.
