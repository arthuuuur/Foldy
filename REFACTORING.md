# 📚 Documentation de Refactorisation - Projet Foldy

## 🎯 Objectifs de la Refactorisation

Cette refactorisation vise à améliorer la qualité du code en éliminant la duplication, en améliorant la structure et en facilitant la maintenance future.

## ✅ Changements Effectués

### Phase 1 : Types Partagés et Constantes

#### Fichiers Créés

**`src/types/cutMode.types.ts`**
- Centralisation de tous les types pour les modes de découpe
- Types exportés : `CutModeParams`, `FoldZone`, `PagePattern`, `CutModeResult`, `Precision`, `MeasurementUnit`
- **Bénéfice** : Élimine la duplication des interfaces (5+ définitions identiques → 1 seule source de vérité)

**`src/constants/app.constants.ts`**
- Centralisation de toutes les valeurs configurables
- Constantes pour : traitement d'image, génération, visualisation 3D, validation
- **Bénéfice** : Élimine les "magic numbers", facilite la configuration

### Phase 2 : Utilitaires Partagés

#### Fichiers Créés

**`src/utils/measurement.utils.ts`**
- `roundValue()` : Arrondi selon la précision (0.1mm, 0.5mm, 1mm)
- `convertToCm()` : Conversion inches → cm
- `calculatePhysicalPages()` : Calcul pages physiques depuis numéro de page
- **Bénéfice** : Élimine 5+ duplications de la fonction roundValue

**`src/utils/image.utils.ts`**
- `getImageData()` : Extraction ImageData depuis base64
- `getPixelGray()` : Lecture valeur de gris d'un pixel
- `isDark()` / `isLight()` : Détection pixels sombres/clairs
- `pixelToPagePosition()` : Conversion pixel → position physique
- **Bénéfice** : Élimine 5+ duplications de getImageData, meilleure réutilisabilité

**`src/utils/validation.utils.ts`**
- `validateCutModeParams()` : Validation unifiée des paramètres
- `getParamsWithDefaults()` : Application des valeurs par défaut
- **Bénéfice** : Validation cohérente, messages d'erreur standardisés

**`src/utils/zoneDetection.utils.ts`**
- `detectZonesInColumn()` : Détection des zones de pliage (dark/light)
- `getColumnXForPage()` : Calcul position colonne pour une page
- **Bénéfice** : Logique métier partagée, code DRY (Don't Repeat Yourself)

### Phase 3 : Architecture Services

#### Fichiers Créés

**`src/services/cutModes/base.cutMode.service.ts`**
- Classe abstraite `BaseCutModeService`
- Méthode `execute()` : Orchestration commune (validation, conversion, génération, stats)
- Méthode abstraite `generatePattern()` : Logique spécifique à implémenter
- **Bénéfice** :
  - Élimine ~70% de code dupliqué entre services
  - Structure cohérente pour tous les modes
  - Facilite l'ajout de nouveaux modes

#### Fichiers Refactorisés

**`src/services/cutModes/inverted.service.ts`**
- Avant : 285 lignes avec duplication
- Après : ~50 lignes, hérite de BaseCutModeService
- Logique métier : Détection zones sombres
- **Amélioration** : -82% de code, focus sur la logique métier

**`src/services/cutModes/embossed.service.ts`**
- Avant : 248 lignes avec duplication
- Après : ~50 lignes, hérite de BaseCutModeService
- Logique métier : Détection zones claires
- **Amélioration** : -80% de code, focus sur la logique métier

## 📊 Métriques d'Amélioration

### Réduction de Duplication

| Élément | Avant | Après | Amélioration |
|---------|-------|-------|--------------|
| Définitions de types | 5 fichiers | 1 fichier | -80% |
| Fonction `roundValue()` | 5 copies | 1 fonction | -80% |
| Fonction `getImageData()` | 5 copies | 1 fonction | -80% |
| Logique validation | 5 copies | 1 fonction | -80% |
| Code InvertedService | 285 lignes | ~50 lignes | -82% |
| Code EmbossedService | 248 lignes | ~50 lignes | -80% |

### Maintenabilité

- ✅ **Types centralisés** : Modification en 1 seul endroit
- ✅ **Constantes configurables** : Facile à ajuster
- ✅ **Code DRY** : Pas de duplication de logique
- ✅ **Architecture claire** : Séparation responsabilités
- ✅ **Testabilité** : Utilitaires isolés, faciles à tester

## 🏗️ Architecture Avant/Après

### Avant

```
Services CutModes (inverted, embossed, etc.)
├─ Types dupliqués dans chaque fichier
├─ roundValue() copié 5 fois
├─ getImageData() copié 5 fois
├─ Validation dupliquée
├─ Logique génération + orchestration mélangées
└─ ~250-300 lignes par service
```

### Après

```
Types Centralisés (cutMode.types.ts)
├─ CutModeParams, FoldZone, PagePattern, etc.
Constantes (app.constants.ts)
├─ Valeurs configurables
Utils
├─ measurement.utils.ts (roundValue, conversions)
├─ image.utils.ts (getImageData, pixels)
├─ validation.utils.ts (validation, defaults)
└─ zoneDetection.utils.ts (détection zones)
Services
├─ base.cutMode.service.ts (classe abstraite)
└─ Services spécifiques (~50 lignes chacun)
    ├─ inverted.service.ts
    ├─ embossed.service.ts
    └─ ... (autres modes)
```

## 🔄 Compatibilité

### Rétrocompatibilité

Tous les exports existants sont maintenus pour compatibilité :

```typescript
// Ancien code (toujours fonctionnel)
import { InvertedService } from './cutModes/inverted.service';
await InvertedService.execute(data, params);

// Nouveau code (aussi supporté)
import InvertedService from './cutModes/inverted.service';
const service = new InvertedService();
await service.execute(data, params);
```

### Imports de Types

```typescript
// Avant
import type { CutModeParams } from './cutModes/inverted.service';

// Après (recommandé)
import type { CutModeParams } from '../types/cutMode.types';
```

## 📝 Guide d'Extension

### Ajouter un Nouveau Mode de Découpe

1. Créer un nouveau service héritant de `BaseCutModeService`
2. Définir le `modeName`
3. Implémenter `generatePattern()`

```typescript
import { BaseCutModeService, GeneratePatternParams } from './base.cutMode.service';
import { PagePattern } from '../../types/cutMode.types';

export class MyNewModeService extends BaseCutModeService {
  protected readonly modeName = 'MyNewMode';

  protected generatePattern(params: GeneratePatternParams): PagePattern[] {
    // Logique spécifique de génération
    return pattern;
  }
}

const service = new MyNewModeService();
export const execute = service.execute.bind(service);
export default MyNewModeService;
```

## 🧪 Tests (À Implémenter - Phase 6)

### Utilitaires à Tester

- `roundValue()` : Précisions 0.1mm, 0.5mm, 1mm, exact
- `convertToCm()` : Conversions cm/in
- `getPixelGray()` : Lecture pixels
- `detectZonesInColumn()` : Détection zones dark/light
- `validateCutModeParams()` : Validation paramètres

### Services à Tester

- Chaque service avec images de test
- Vérification patterns générés
- Validation erreurs

### Phase 4 : Découpage generate.tsx ✅

#### Composants Créés

**`src/components/ImageUpload.tsx`** (176 lignes)
- Upload d'image avec drag & drop
- Prévisualisation d'image
- Validation des formats
- **Bénéfice** : Composant réutilisable, logique isolée

**`src/components/GenerateForm.tsx`** (297 lignes)
- Formulaire de paramètres complet
- Gestion des champs spécifiques par mode
- Section Advanced Settings
- **Bénéfice** : Séparation des responsabilités, validation centralisée

**`src/components/PatternVisualization2D.tsx`** (248 lignes)
- Statistiques globales (pages, zones)
- Grille de navigation entre pages
- Détails des zones de pliage
- **Bénéfice** : Visualisation isolée, réutilisable

**`src/hooks/useGenerateForm.ts`** (204 lignes)
- Hook personnalisé pour toute la logique métier
- Gestion de 15+ états
- Actions de génération et manipulation d'image
- **Bénéfice** : Logique testable séparément du UI

#### Résultats

**Fichier refactorisé : `src/routes/_authenticated/generate.tsx`**
- Avant : 1020 lignes monolithiques
- Après : 378 lignes (-63%)
- Focus sur : Layout et orchestration uniquement

**Composition du nouveau code :**
- generate.tsx : 378 lignes (orchestration)
- ImageUpload : 176 lignes (upload)
- GenerateForm : 297 lignes (formulaire)
- PatternVisualization2D : 248 lignes (visualisation)
- useGenerateForm : 204 lignes (logique métier)
- **Total : 1303 lignes** réparties en 5 fichiers

**Amélioration :**
- ✅ Code 63% plus court dans le fichier principal
- ✅ 4 composants réutilisables créés
- ✅ Séparation claire des responsabilités
- ✅ Hook testable pour la logique métier
- ✅ Maintenabilité grandement améliorée

## 📋 Prochaines Phases

### Phase 5 : Optimisation Performances
- React.memo sur composants
- useMemo pour calculs coûteux
- Optimisation Three.js

### Phase 6 : Tests Unitaires
- Tests utilitaires
- Tests services
- Coverage > 80%

### Phase 7 : Gestion d'Erreurs
- Error boundaries React
- Service d'erreurs centralisé
- Messages utilisateur

## 🎓 Bonnes Pratiques Appliquées

1. **DRY (Don't Repeat Yourself)** : Élimination duplication
2. **Single Responsibility** : Chaque fichier/fonction une responsabilité
3. **Open/Closed Principle** : Ouvert extension, fermé modification (classe abstraite)
4. **Separation of Concerns** : Types/Utils/Services séparés
5. **Type Safety** : TypeScript strict, types explicites
6. **Documentation** : JSDoc sur toutes les fonctions publiques
7. **Nommage explicite** : Noms clairs, auto-documentés

## 🔗 Références

- [Clean Code (Robert C. Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring (Martin Fowler)](https://refactoring.com/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
