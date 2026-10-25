import { Item, VintedItem, MatchResult } from '../types';

export function cleanStr(s?: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

export function smartMatch(piece: Item, vintedList: VintedItem[]): MatchResult {
  let bestMatch: VintedItem | null = null;
  let highestScore = 0;

  const pBrand = cleanStr(piece.brand);
  const pTitle = cleanStr(piece.title);
  const pWords = pTitle.split(/\s+/).filter(w => w.length > 2);

  for (const v of vintedList) {
    let score = 0;
    const vBrand = cleanStr(v.brand);
    const vTitle = cleanStr(v.title);

    // 1. Marque match (40 pts)
    if (pBrand === vBrand || (pBrand.length > 3 && vBrand.includes(pBrand)) || (vBrand.length > 3 && pBrand.includes(vBrand))) {
      score += 40;
    } else if (pTitle.includes(vBrand) || vTitle.includes(pBrand)) {
      score += 30;
    }

    // 2. Mots-clés Titre (jusqu'à 40 pts)
    let matchedWords = 0;
    for (const w of pWords) {
      if (vTitle.includes(w)) matchedWords++;
    }
    if (pWords.length > 0) {
      score += Math.min(40, (matchedWords / pWords.length) * 40);
    }

    // 3. Taille match (10 pts)
    if (piece.size && v.size && cleanStr(piece.size) === cleanStr(v.size)) {
      score += 10;
    }

    // 4. Proximité de prix cible (10 pts)
    if (piece.targetPrice && v.price) {
      const ratio = Math.min(piece.targetPrice, v.price) / Math.max(piece.targetPrice, v.price);
      if (ratio > 0.7) score += 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = v;
    }
  }

  const isMatched = highestScore >= 45;
  return {
    matched: isMatched,
    score: Math.round(highestScore),
    vintedItem: isMatched ? bestMatch : null
  };
}
