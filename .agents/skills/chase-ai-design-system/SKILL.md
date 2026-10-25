---
name: chase-ai-design-system
description: Systeme complet de direction artistique web, d'extraction de gout (Taste Library), de workflow de conception en entonnoir (5 -> 3 -> 1), de regles anti-AI-Slop (Impeccable & Taste Skill) et d'integration d'une barre de reglages en direct (Tweaks Bar). A utiliser des que l'utilisateur veut concevoir, prototyper, auditer ou ameliorer un site web, une landing page, un composant UI, analyser une capture d'ecran/URL d'inspiration design, ou eliminer le rendu generique IA (AI Slop).
---
# Chase AI Design System

Ce skill transforme l'agent en directeur artistique web expert pour vaincre le "AI Slop" (le design IA generique aux degrades bleu/violet, cartes SaaS standardisees et police Inter partout). Il combine la methode en 3 etapes de Chase AI, les principes des skills open-source **Impeccable** (`impeccable.style`) et **Taste Skill**, ainsi que le workflow d'exploration en entonnoir avec panneau de reglages en direct (**Tweaks Bar**).

## When to Use

Activer ce skill des que l'utilisateur :

- Envoie une capture d'ecran, une image ou une URL de site web pour en extraire le style, le vocabulaire design ou creer une "Taste Library".
- Demande de creer ou refondre un site web, une landing page, un dashboard ou un composant UI avec un rendu unique, editorial ou haut de gamme.
- Mentionne "Chase AI", "AI Slop", "Impeccable", "Taste Skill", "Tweaks Bar", ou le workflow en entonnoir (5 variantes -> 3 variantes -> 1 finale).
- Utilise ou demande une commande directionnelle comme `bolder`, `quieter`, `overdrive`, `clarify`, `critique`, `polish`, `distill`, `typeset` ou `layout`.

## 1. Les 4 Modes de Surface (Impeccable Architecture)

Avant de concevoir ou modifier une interface, identifier le **Mode** de la surface demandee pour calibrer l'ambition visuelle :

1. **Persuade** (Landing pages, pages marketing, lancements, pricing) : Le visiteur doit ressentir, decider et agir. Le design EST le produit. Pousser la direction artistique, l'impact visuel, la typographie expressive et les visuels Hero monumentaux.
2. **Operate** (Dashboards, applications SaaS, outils, reglages, editeurs) : Le visiteur accomplit une tache. La lisibilite, la densite d'information maîtrisée, la coherence et la precision des details l'emportent sur l'exuberance.
3. **Read** (Documentation, articles, blogs, guides, changelogs) : Le visiteur cherche a comprendre. Structurer pour la lecture au long cours, la hierarchie typographique et le calme visuel.
4. **Experience** (Portfolios, galeries, vitrines interactives) : Le visiteur est immerge dans l'oeuvre. L'interface s'efface au profit de l'artefact visuel des le premier ecran.

## 2. Garde-fous Anti-AI-Slop (Craft Floor & Taste Skill)

Sauf demande explicite contraire dans le brief de l'utilisateur, appliquer systematiquement ces interdictions et exigences :

- **Bannir les cliches IA (AI Slop)** :
  - Pas de degrades violet/bleu/indigo sur fond sombre par defaut.
  - Pas de police `Inter`, `Roboto` ou `Arial` utilisee seule sans caractere typographique.
  - Pas de grilles symetriques de 3 cartes identiques avec une petite icone dans un cercle colore en haut a gauche.
  - Pas de blobs 3D abstraits generiques, de halos lumineux ("glows") baveux ou d'ombres portees lourdes et floues.
  - Pas de copywriting creux ("Revolutionize your workflow", "Unleash the power of AI", "Seamless integration").
- **Exigences de Craft (Taste Dials)** :
  - **Typographie** : Associer des polices a forte personnalite (ex: Serif editoriale comme *Instrument Serif*, *Playfair Display*, *Newsreader* + Sans géométrique/grotesque comme *Plus Jakarta Sans*, *Space Grotesk*, *Syne* + Monospace technique comme *JetBrains Mono*, *IBM Plex Mono* pour les labels, index et metadonnees).
  - **Espace & Grille** : Privilegier l'asymetrie maitrisee, les bordures fines visibles (`1px solid` a faible opacite type *Ledger* ou *Print Tech*), les grands espaces negatifs ou les mises en page editoriales.
  - **Mouvement & Poids** : Les transitions entre le Hero et le Body doivent etre progressives (pas de coupure brutale). Les animations d'apparition doivent avoir du poids (`cubic-bezier(0.22, 1, 0.36, 1)`) et un decalage sequentiel (*staggered reveal*).

## 3. Module 1 : Extraction du Gout (Taste Extractor)

Lorsque l'utilisateur partage une capture d'ecran, une image ou une URL d'inspiration, analyser l'entree et fournir une fiche structuree contenant :

1. **Nom de la Famille Esthetique & Vocabulaire** : Nommer le style avec precision (ex: *Print Tech Paper*, *Vast Quiet Cinematic*, *Dither Mono*, *Swiss Brutalist Ledger*, *Classical Editorial Remix*, *Warm Tactile Industrial*) et lister 5 a 7 mots-cles techniques decrivant la composition.
2. **ADN Visuel (Tokens & Trade-offs)** :
   - Palette exacte (couleurs de fond, texte principal, texte secondaire, bordures, couleur d'accent unique < 5% de la surface).
   - Combinaison typographique recommandee (Google Fonts directement importables).
   - Regles de structure (type de grille, traitement des bordures, densite, style de navigation).
   - *Pourquoi ca fonctionne (Trade-offs)* : Expliquer les choix radicaux qui donnent son ame au design (ex: "Sacrifie la couleur au profit de la texture papier et des filets typographiques").
3. **Prompt Image / Hero HD** : Un prompt detaille pret a copier pour generer un visuel de fond ou Hero (format 2K, composition, lumiere, texture, espace libre pour le texte).
4. **Brief en 4 Piliers pret a copier** :
   - **1. Esthetique** : La famille de design et l'ambiance.
   - **2. Reference (Feel)** : Ce qu'il faut emprunter au ressenti sans copier le contenu.
   - **3. Intention (Intent)** : Cible, produit et action principale attendue (CTA).
   - **4. Garde-fous (Guardrails)** : Ce qu'il faut toujours faire et ne jamais faire.

## 4. Module 2 : Le Workflow de Conception en Entonnoir (5 -> 3 -> 1)

Ne jamais tenter de "one-shot" un site web complet sans direction validee. Suivre cette sequence iterative (sauf si l'utilisateur impose deja une direction unique) :

### Etape A : Exploration Large (5 familles esthetiques)

Si le projet demarre de zero ou d'un brief ouvert, proposer ou generer **5 directions esthetiques contrastees** (sous forme de maquettes commutables via un selecteur d'onglets en haut de l'ecran ou de 5 propositions visuelles distinctes) :

- Exemple de 5 familles :
  1. **Print Tech / Paper Ledger** (Fond creme/papier, filets fins visibles, typographie mono + serif, donnees traitees comme de la texture).
  2. **Vast Quiet Cinematic** (Hero monumental contemplatif plein ecran, minimalisme extreme, typographie tres aeree, ambiance calme et lourde).
  3. **Dither Mono / Terminal Haute Couture** (Contraste noir/blanc ou monochrome, trames bitmap/dithering, esthetique technique brute et chirurgicale).
  4. **Classical Remix / Editorial Luxury** (Grille de magazine d'art, grands titres en serif italique, cadrages photographiques forts, tons chauds).
  5. **Swiss Kinetic Grid** (Grille modulaire stricte, typographie grotesque geante, micro-interactions franches, touche de couleur industrielle type orange international ou vert acide).

### Etape B : Declinaison Structurelle du Body (3 variantes)

Une fois que l'utilisateur a choisi sa famille esthetique preferee parmi les 5, decliner cette esthetique en **3 structures de mise en page (Body Layouts)** :

- **Variante A - Minimal Vertical** : Flux central epure, forte respiration verticale, lecture sequentielle calme.
- **Variante B - Quiet Ledger (Index lateral fixe)** : Contenu decale avec une colonne d'index/chapitrage a gauche qui suit le scroll (`position: sticky`) et structure la page comme un registre.
- **Variante C - Framed Modules (Cadres architecturaux)** : Sections encadrees par des bordures ou des marges structurees qui decoupent chaque bloc avec precision.

### Etape C : Habillage Hero, Transitions & Tweaks Bar (1 version finale)

Une fois la structure retenue :

1. **Soigner le Hero et la transition** : Creer une transition fluide et naturelle entre le Hero et le corps de la page (degrade de fondu subtil, chevauchement editorial ou transition de rythme) et ajouter un chargement progressif lourd et fluide des elements.
2. **Injecter obligatoirement la "Tweaks Bar"** : Dans tout prototype HTML/CSS/JS final ou intermediaire livre a l'utilisateur, integrer un bouton flottant discret `⚙ Tweaks` en bas a droite qui ouvre un panneau de controle interactif en temps reel.

## 5. Specification de la "Tweaks Bar" Interactive

Chaque fois que tu generes du code HTML/React pour une page web, inclus un panneau flottant **Tweaks Bar** (repliable en bas a droite, qui n'ecrase pas le design) permettant a l'utilisateur de tester visuellement en direct via des variables CSS (`--font-heading`, `--font-body`, `--bg-color`, `--accent-color`, `--border-opacity`, `--reveal-weight`, etc.) :

- **Typographie des titres** : Selecteur entre 4 polices Google Fonts pre-chargees (ex: Serif editoriale, Sans geometrique, Display brutale, Monospace) + toggle Italique + slider de taille (`scale`).
- **Typographie du corps & Index** : Selecteur de police + ajustement de l'interlignage et de l'espacement des lettres (`letter-spacing`).
- **Palette & Ambiance Colorimetrique** : Selecteur de variantes de teintes (ex: *Original Monochrome*, *Dawn / Golden Hour*, *Alpenglow*, *Paper Warmth*, *High Contrast Ink*) + couleur d'accentuation.
- **Structure & Densite** : Opacite des bordures/grilles (`0%` a `100%`), espacement vertical des sections (`Compact`, `Balanced`, `Vast`), et rayon de bordure (`0px` sharp vs `8px` soft).
- **Mouvement & Poids** : Vitesse et poids des animations de scroll (`Heavy/Slow`, `Crisp/Fast`, `Off`) et intensite de la transition Hero/Body.
- **Bouton "Copy Config"** : Un bouton dans la Tweaks Bar qui copie dans le presse-papier les reglages exacts choisis par l'utilisateur pour qu'il puisse les coller dans le chat afin de les figer definitivement.

## 6. Les Commandes Directionnelles (Style Impeccable)

Si l'utilisateur demande d'appliquer l'une de ces commandes sur un design existant, agir immediatement selon sa definition :

- **`critique`** : Ne pas modifier le code tout de suite. Inspecter le design, traquer les traces d'AI Slop, noter l'utilisabilite et l'intentionnalite sur 4 axes (Qualite visuelle, Hierarchie, Clarte, Singularite) et proposer les 3 priorites de correction.
- **`bolder`** : Renforcer une section timide ou oubliable. Donner un leadership clair a l'element principal, amplifier le contraste d'echelle typographique et affirmer la composition sans tomber dans le chaos ni trahir l'identite existante.
- **`quieter`** : Reduire le bruit visuel lorsque trop de couleurs, de bordures ou d'effets se disputent l'attention. Faire reculer les elements secondaires pour que l'action ou le contenu principal respire.
- **`overdrive`** : Pousser l'ambition technique et visuelle d'un cran (effets de grain/dither subtils, transitions choregraphiees, mise en page audacieuse, micro-interactions haute couture).
- **`clarify`** : Reecrire tous les textes d'interface (boutons vagues, messages d'erreur, formulaires, etats vides) et remplacer le jargon IA par un copywriting precis, humain et oriente action.
- **`distill`** : Eliminer l'encombrement et les composants redondants pour ne garder que l'essentiel structurel.
- **`polish`** : Passe de finition chirurgicale (alignements optiques, coherence des espacements, etats hover/focus, contraste et responsive).

## Gotchas

- **Le Brief gagne toujours** : Si l'utilisateur impose une couleur, une epoque ou une police specifique, respecter son choix a 100 % meme s'il diverge des recommandations par defaut.
- **Ne jamais melanger Refonte et Raffinement** : Un raffinement (`bolder`, `quieter`, `polish`) conserve l'identite et le texte existants. Une refonte remplace l'univers visuel tout en preservant la verite du produit.
- **Code complet et autonome** : Lors de la generation de prototypes web, toujours fournir un fichier complet, fonctionnel, avec les vraies polices Google Fonts importees et la **Tweaks Bar** pleinement operationnelle en JavaScript.
