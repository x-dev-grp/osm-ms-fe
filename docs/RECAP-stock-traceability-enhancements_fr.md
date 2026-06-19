# OSM — Récapitulatif : stock, nomenclature, traçabilité et améliorations de l'interface utilisateur/UX

**Date :** mai 2026  
**Dépôts :** `osm-ms-fe` (Angulaire), `osmproject` (`osm-pack`, `osm-cond`)  
**Portée :** Commande de traçabilité de bout en bout, règles métier d'inventaire/nomenclature, intégration de conditionnement (projets/OF), UX frontend et tests opérationnels.

---

## Table des matières

1. [Résumé exécutif](#1-executive-summary)
2. [Traçabilité (conditionnement)](#2-traceability-conditioning)
3. [Modèle de stock et d'inventaire](#3-stock--inventory-model)
4. [Back-end — `osm-pack` (service d'inventaire)](#4-backend--osm-pack-inventory-service)
5. [Back-end — `osm-cond` (service de conditionnement)](#5-backend--osm-cond-conditioning-service)
6. [Migration de base de données](#6-database-migration)
7. [L'extrémité avant - `osm-ms-fe`](#7-frontend--osm-ms-fe)
8. [Actualisation UI/UX](#8-uiux-refresh)
9. [Corrections de bugs (modification de nomenclature / actif)](#9-bug-fixes-bom-edit--active)
10. [Référence API (nouveau/important)](#10-api-reference-new--important)
11. [Ordre de déploiement et de vérification](#11-deployment--verification-order)
12. [Liste de contrôle des tests](#12-testing-checklist)
13. [Index des fichiers clés](#13-key-files-index)
14. [Limites connues et suivis](#14-known-limitations--follow-ups)

---

## 1. Résumé

Ce travail repose sur trois piliers :

| Pilier | Qu'est-ce qui a changé |
|--------|----------------|
| **Traçabilité** | Arbre d'événements construit dans un véritable ordre chronologique (réception → stockage → filtration → conditionnement → expédition), sans inverser le contrôle qualité ni le placement d'admission. |
| **Stock / Nomenclature** | Nomenclature active par produit fini, validation à la création/mise à jour, API de prévisualisation des besoins en matières, API de synthèse des stocks, références de mouvements, gardes de désactivation des articles, réservations de projets atomiques. |
| **UX front-end** | Commun `material-needs-preview`, des écrans d'articles/de nomenclature plus riches, des filtres, des KPI, des toasts et un style d'inventaire cohérent via `_inventory-ui.scss`. |

---

## 2. Traçabilité (conditionnement)

### Problème

Le calendrier de traçabilité peut apparaître **le plus récent en premier** ou placer les nœuds de contrôle qualité/d'admission de manière incorrecte pour les raisons suivantes :

- Un tri global sur `displayOrderRank`
- `Collections.reverse()` appliqué après la construction de l'arbre

### Solution (`TraceabilityEventTreeBuilder.java`)

L'ordre de construction est désormais **explicite et chronologique** :

1. Chaîne d'admission amont (`sourceIntakeChain` de la filtration la plus ancienne)
2. Événements racine (dédupliqués)
3. Filtrations + CQ associé
4. Événements d'admission restants
5. Stockage final
6. CQ filtré
7. OF (ordres de fabrication)
8. Étiquettes
9. Expéditions

`parentId` et `sequence` sont attribués **après** que cet ordre soit corrigé.

### L'extrémité avant

- La chronologie affiche les événements par ordre chronologique (non `column-reverse` sur la chronologie).
- Des étiquettes alignées sur le vocabulaire besoins matériels/traçabilité utilisé ailleurs.

### Fichier clé

- `osm-cond/.../expedition/service/TraceabilityEventTreeBuilder.java`

---

## 3. Modèle de stock et d'inventaire

Comprendre est utile lors du test des flux de nomenclature, de projets et d'OF.

### Entités (`osm-pack`)

| Concepts | Rôle |
|---------|------|
| **ArticleSec** | Article stockable (matière première, emballage, etc.) |
| **StockSec** | 1:1 avec article — tient `quantiteActuelle`, `quantiteReservee` |
| **ProduitFinal** | Produit fini (tableau `skus`) |
| **BOM + BomLine** | Recette : composants consommés **par unité** de produit fini |

### Quantités

- **Un stock** = `quantiteActuelle`
- **Réservé** = `quantiteReservee` (par exemple, réservations de projets)
- **Disponible** = `quantiteActuelle − quantiteReservee`

### Intégration du conditionnement (`osm-cond`)

- Client simulé `clientInventaire` appelle les API d'inventaire.
- **Projets** réserve de stock lors de la sauvegarde (lot atomique avec restauration en cas de panne partielle).
- **OF** créer/démarrer/fermer consommer ou vérifier le stock ; La nomenclature active peut être automatiquement sélectionnée lors de la création.

---

## 4. Back-end — `osm-pack` (service d'inventaire)

### Exceptions et erreurs API

- **`InventoryBusinessException`** — violations des règles métier avec `code`, `error`, `message`.
- **`GlobalExceptionHandler`** — mappe les exceptions aux réponses HTTP cohérentes pour le frontend (toasts).

### Nomenclature (`BomService`, `BomController`)

| Fonctionnalité | Descriptif |
|---------|-------------|
| **`active` drapeau** | Une nomenclature active par produit fini ; l'activation désactive les frères et sœurs (`saveAll`). |
| **Validation** | Produit requis ; au moins une ligne ; pas d'articles en double ; articles actifs uniquement ; aucun produit VRAC comme en-tête de nomenclature. |
| **`activateBom`** | `PUT /api/inventaire/boms/{id}/activate` |
| **`getActiveBomForProduct`** | `GET .../product/{productId}/active` (404 si aucun) |
| **`material-needs`** | `GET .../boms/{id}/material-needs?quantity=` — besoin par ligne par rapport au stock disponible |
| **Supprimer la garde** | Impossible de supprimer une nomenclature **active** |
| **`updateBom`** | Lors du réglage `active: true`, conserve toutes les nomenclatures de ce produit afin qu'une seule reste active |

### Action (`StockSecService`, `StockSecController`)

| Fonctionnalité | Descriptif |
|---------|-------------|
| **`GET /stocks/summary`** | Lightweight list: per-article actuel / réservé / disponible / `belowMinimum` |
| **Références de mouvement** | Les mouvements peuvent porter `referenceType` + `referenceId` (OF, projet, etc.) |

### Articles (`ArticleSecService`)

- **`desactiverArticle`** bloqué si : un stock ou des réservations existent, ou un article est utilisé dans une ligne de nomenclature.

### Besoins matériels (`MaterialNeedsService`)

- Calcule les quantités arrondies par ligne de nomenclature pour une quantité de production cible.
- Se compare au mode disponible (ou au mode réservé à la demande du consommateur).

### Fichiers clés

```
osm-pack/src/main/java/com/osm/inventory_service/
  exception/InventoryBusinessException.java
  exception/GlobalExceptionHandler.java
  service/BomService.java
  service/StockSecService.java
  service/MaterialNeedsService.java
  service/ArticleSecService.java
  controller/BomController.java
  controller/StockSecController.java
```

---

## 5. Back-end — `osm-cond` (service de conditionnement)

### `InventoryQuantityUtil`

- Gestion des nombres entiers plafonnés/sûrs pour les quantités envoyées à l'inventaire (évite les bugs de réservation fractionnaire).

### Projet (`ProjetService`)

- **Réservations atomiques :** toutes les réservations d'articles tentées ; en cas d'échec, **rollback** confirme les réservations et fait apparaître une erreur claire.
- Message de blocage lorsque les réservations sont insuffisantes sur les transitions de statut.

### DE (`OFService`)

- Contrôle des stocks au **démarrage** (OF lié au projet et autonome).
- **BOM active**, sélection automatique lors de la création lorsque cela est possible (`getActiveBomForProduct`; 404 traités).
- **`resolveArticleLabel`** pour des étiquettes de consommation/traçabilité plus claires.
- Consommation avec mouvement **referenceType** / **referenceId**.

### Traçabilité

- Voir [§2](#2-traceability-conditioning).

### Fichiers clés

```
osm-cond/src/main/java/com/osm/conditioning/
  util/InventoryQuantityUtil.java
  projet/service/ProjetService.java
  service/OFService.java
  expedition/service/TraceabilityEventTreeBuilder.java
```

---

## 6. Migration de base de données

**Déposer:** `osm-pack/src/main/resources/db/migration/V20260523__stock_bom_enhancements.sql`

```sql
ALTER TABLE bom ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mouvements_stock_secs ADD COLUMN IF NOT EXISTS reference_type VARCHAR(64);
ALTER TABLE mouvements_stock_secs ADD COLUMN IF NOT EXISTS reference_id UUID;
```

Appliquez-le dans tous les environnements avant de vous fier à une nomenclature active ou à des références de mouvement. Si hiberner `ddl-auto` colonnes déjà appliquées, la migration est idempotente (`IF NOT EXISTS`).

---

## 7. Front-end — `osm-ms-fe`

### Composant partagé

| Composant | Chemin | Rôle |
|-----------|------|------|
| **`MaterialNeedsPreviewComponent`** | `src/app/shared/components/material-needs-preview/` | Appels `GET .../boms/{id}/material-needs`; affiche OK / manque par ligne ; prend en charge `useReservedStock` for projet mode |

### Services

| Services | Méthodes ajoutées/utilisées |
|---------|----------------------|
| **`BomService`** | `getActiveBomForProduct`, `activate`, `getMaterialNeeds` |
| **`StockService`** | `getStockSummary()` |

### Stock — Articles

- **Liste :** colonnes En stock / Disponible / Réservé du résumé API ; lignes d'alerte inférieures au minimum ; bannière d'informations avec nombre d'alertes.
- **Détail :** Grille KPI (stock / réservé / disponible) ; indice en cas de réservation ; état vide lorsqu'il n'y a pas d'enregistrement de stock.

### Stock — Nomenclature

- **Liste :** filtre actif/inactif, bannière d'informations, clic sur la ligne → détail, activation à partir de la liste, pilules d'état.
- **Formulaire :** validation + toasts ; **bascule active en mode édition** ; aperçu du matériau lors de l'édition ; fil d'Ariane; pied de page collant.
- **Détail :** bouton d'activation ; simulateur de quantité + aperçu des besoins en matériel.

### Projet & DE

- **Formulaire projet :** aperçu du matériel avant réservation (`useReservedStock: true`).
- **Formulaire OF :** aperçu lorsque la nomenclature + la quantité cible sont définies ; `useReservedStock` lorsqu'il est lié à un projet.

### Modèles

- `MaterialNeedLine` - modèle partagé pour les lignes d'aperçu.
- `ArticleStockSummary` - Réponse API récapitulative pour la liste d'articles.

---

## 8. Actualisation UI/UX

### Styles partagés

**Déposer:** `src/app/stock/styles/_inventory-ui.scss`

- Jetons de conception : `$inv-primary`, `$inv-success`, `$inv-danger`, bordures, rayons, ombres.
- Mixins : `inv-card`, `inv-pill`, `inv-page-shell`.

### Écrans mis à jour

| Écran | Améliorations UX |
|--------|-----------------|
| **Liste de nomenclature** | Copie française, bannière d'ampoule, filtre de barre d'outils, surbrillance de ligne active, lignes cliquables |
| **Formulaire de nomenclature** | Basculer la carte pour actif, grille de formulaire, barre de sauvegarde collante, fil d'Ariane |
| **Détail de la nomenclature** | Pilules d'état, saisie de la quantité d'aperçu, besoins en matériel intégré |
| **Liste d'articles** | Puces de couleur pour les colonnes de stock, bande d'alerte, bannière de résumé |
| **Détail de l'article** | Trois cartes KPI sur carte de stock dégradée, indice de réservation |
| **Le matériel a besoin d'un aperçu** | Badges d'en-tête (suffisants/insuffisants), conseils de mode (disponible vs réservé), nombre de pénuries dans le tableau |
| **Formulaires Projet / OF** | `material-preview-block` style séparateur |

Construction vérifiée : `ng build --configuration=development` réussit.

---

## 9. Corrections de bugs (modification de nomenclature / actif)

Problèmes signalés et correctifs :

| Problème | Parce que | Corriger |
|-------|-------|-----|
| Impossible de marquer la nomenclature active lors de l'édition | Case à cocher active uniquement lors de la création (`*ngIf="!isEditMode"`) | Bascule active affichée en mode édition |
| Impossible de supprimer les lignes de nomenclature | Supprimer le bouton à l'extérieur `*ngFor` | Bouton à l'intérieur de chaque ligne |
| Liste déroulante d'articles vide lors de la modification | Uniquement les articles actifs chargés | `getAllArticles` + `ensureArticleInList` pour lignes existantes |
| L'activation d'une nomenclature a laissé les autres actives dans la base de données | `updateBom` n'a pas `saveAll` frères et sœurs | Back-end `saveAll` lors de l'activation ; FE envoie `version` + `active` |

---

## 10. Référence API (nouveau / important)

URL de l'inventaire de base (via la passerelle) : `{apiUrl}/api/inventaire`

### Nomenclature

| Méthode | Chemin | Descriptif |
|--------|------|-------------|
| `GET` | `/boms/all` | Répertorier toutes les nomenclatures |
| `GET` | `/boms/{id}` | Détail de la nomenclature |
| `GET` | `/boms/product/{productId}/active` | Nomenclature active pour le produit (404 si aucune) |
| `PUT` | `/boms/{id}/activate` | Activer la nomenclature (désactive les frères et sœurs) |
| `GET` | `/boms/{id}/material-needs?quantity={n}` | Besoins matériels vs stock |
| `POST` | `/boms/create` | Créer une nomenclature |
| `PUT` | `/boms/{id}` | Mettre à jour la nomenclature (y compris `active`) |
| `DELETE` | `/boms/{id}` | Supprimer (bloqué si actif) |

### Action

| Méthode | Chemin | Descriptif |
|--------|------|-------------|
| `GET` | `/stocks/summary` | Récapitulatif des stocks par article pour les listes |

### Forme d'erreur (inventaire)

Corps d’erreur métier typique :

```json
{
  "code": "BOM_ACTIVE_DELETE",
  "error": "Business rule violation",
  "message": "Human-readable French message"
}
```

---

## 11. Ordre de déploiement et de vérification

1. **Base de données** – Exécuter `V20260523__stock_bom_enhancements.sql` (ou équivalent) sur la base de données d'inventaire.
2. **Redémarrage `osm-pack`** — service d'inventaire avec une nouvelle logique BOM/stock.
3. **Redémarrage `osm-cond`** — conditionnement avec Feign + modifications projet/OF/traçabilité.
4. ** Reconstruire et déployer `osm-ms-fe`** — Application angulaire avec de nouveaux composants et itinéraires inchangés.
5. **Test de fumée** — Activation de la nomenclature, besoins matériels, récapitulatif de la liste d'articles, sauvegarde du projet avec réservation, démarrage OF.

**Remarque :** La cible de la compilation back-end est **Java 21**.

---

## 12. Liste de contrôle des tests

### Traçabilité

- [ ] Open projet traceability for a lot with full chain (réception → stockage → filtration → conditionnement → expédition).
- [ ] Confirmez que la chronologie indique **le plus ancien → le plus récent**.
- [ ] Confirmez que les nœuds QC apparaissent à côté de l'étape de filtration/admission correcte.

### Nomenclature

- [ ] Créer une nomenclature avec des lignes → enregistrer → apparaît dans la liste.
- [ ] Activer depuis la liste ou le détail → un seul actif par produit.
- [ ] Modifier la nomenclature : modifier les lignes, activer, enregistrer.
- [ ] Essayez de supprimer la nomenclature active → toast d'erreur.
- [ ] `material-needs` sur le détail : modifier la quantité → mises à jour du tableau ; lignes de pénurie mises en évidence.

### Articles et stocks

- [ ] Article list loads summary columns (stock / dispo / réservé).
- [ ] Lignes en dessous du minimum mis en surbrillance + nombre de bannières.
- [ ] Les KPI des détails de l'article correspondent à l'API boursière.
- [ ] Désactiver l'article avec utilisation du stock ou de la nomenclature → bloqué avec message.

### Projet

- [ ] Create projet with products → BOM summary + material preview (réservé mode).
- [ ] Enregistrer → réservations en inventaire ; une défaillance partielle est annulée (tester avec un stock insuffisant si possible).

### DE

- [ ] Créer OF → BOM active présélectionnée lorsqu'elle est disponible.
- [ ] Démarrer OF avec un stock insuffisant → effacer l'erreur.
- [ ] Fermer OF → consommation avec références dans les mouvements (si inspection DB/API).

---

## 13. Index des fichiers clés

### Back-end (`osmproject`)

| Zone | Chemin |
|------|------|
| Migrations | `osm-pack/src/main/resources/db/migration/V20260523__stock_bom_enhancements.sql` |
| BONNE logique | `osm-pack/.../service/BomService.java` |
| Besoins matériels | `osm-pack/.../service/MaterialNeedsService.java` |
| Sommaire boursier | `osm-pack/.../service/StockSecService.java` |
| Exceptions | `osm-pack/.../exception/` |
| Projet reserve | `osm-cond/.../projet/service/ProjetService.java` |
| DE + stock | `osm-cond/.../service/OFService.java` |
| Arbre de traçabilité | `osm-cond/.../expedition/service/TraceabilityEventTreeBuilder.java` |
| Qté utile | `osm-cond/.../util/InventoryQuantityUtil.java` |

### L'extrémité avant (`osm-ms-fe`)

| Zone | Chemin |
|------|------|
| Aperçu partagé | `src/app/shared/components/material-needs-preview/` |
| Styles d'inventaire | `src/app/stock/styles/_inventory-ui.scss` |
| Liste/formulaire/détail de nomenclature | `src/app/stock/components/bom/` |
| Liste/détail des articles | `src/app/stock/components/article/` |
| BomService | `src/app/stock/services/BomService.ts` |
| StockService | `src/app/stock/services/stock.service.ts` |
| Formulaire de projet | `src/app/projet/pages/projets/projet-form/` |
| Formulaire OF | `src/app/OF/components/of/of-form/` |
| Traçabilité des projets | `src/app/projet/pages/projets/projet-traceability/` |

---

## 14. Limites connues et suivis

| Article | Remarques |
|------|-------|
| **Aucun aperçu côté client pour la nomenclature non enregistrée** | L'API des besoins matériels nécessite une persistance `bomId`; la nouvelle nomenclature doit d'abord être enregistrée. |
| **Activer depuis la liste** | Fonctionne via API ; UX en option : bascule en ligne sans navigation. |
| **Mappage global des exceptions** | Quelques `RuntimeException`Les s en inventaire peuvent toujours correspondre à 400 – intentionnel pour les toasts FE mais peuvent masquer des bugs inattendus. |
| **Autres écrans de stock** | Emplacements, liste de mouvements — pas encore alignés sur `_inventory-ui.scss` (suivi facultatif). |
| **Feignez 404 sur la nomenclature active** | Attendu lorsqu'aucune nomenclature n'est active ; DE créer des poignées avec grâce. |

---

## Contexte de la conversation

Ce document consolide le travail de la session agent sur le stock, la nomenclature, la traçabilité, la validation et l'UI/UX (mai 2026). Pour obtenir la transcription complète au niveau de l’outil, consultez la transcription de l’agent Cursor pour cette session.

---

*Généré pour l'équipe OSM — gardez ce fichier à jour lors de l'ajout de fonctionnalités d'inventaire ou de traçabilité.*
