# Annexe B — Revue technique et fonctionnelle de la Réception

Cette annexe s'adresse à l'équipe produit, au développement et au support. Elle décrit l'implémentation du module Réception et liste les écarts constatés lors de la revue du 28 septembre 2026. Les points R-01 à R-10 et R-19 ont été corrigés dans le périmètre Réception; les autres écarts restent ouverts.

Chemins : frontend `F:/osm-ms-fe/src/app/reception/` ; backend `F:/oosm/modules/production/src/main/java/com/xdev/ooms/production/`.

## B.1 Architecture

- **Pas de module backend dédié :** `modules/reception` ne contient qu'un `package-info.java`. Toute la logique est dans le module production.
- **Une seule table pour toutes les réceptions :** l'entité `UnifiedDelivery` (`unifieddelivery/entity/UnifiedDelivery.java`) porte les réceptions d'olives et d'huile ; `deliveryType` (OLIVE, OIL) et `operationType` (SIMPLE_RECEPTION, BASE, OLIVE_PURCHASE, EXCHANGE, OIL_PURCHASE, PAYMENT…) déterminent le parcours.
- **Services principaux :** `UnifiedDeliveryService` (création, prix, paiement, numérotation, actions), `PlanningService` (planning et finalisation), `QualityControlResultService` (contrôle qualité et changements de statut), `OilTransactionService` (mouvements de cuve), `dayimport/**` (import Excel).
- **Actions par ligne :** calculées par le backend (`UnifiedDeliveryService.actionsMapping`, lignes 344 à 535) selon le type, le statut et l'option de planification, puis filtrées par les droits de l'utilisateur (`BaseControllerImpl`).
- **Écrans :** listes génériques `OosmDashboard` (barre d'outils commune), formulaires `olive-reception-form`, `oil-reception-form`, `controleQualite`, `planning`, `completion-details-dialog`, `supplier-payment-history`, `details-reception`, `import/reception-import-wizard`, `supplier-*`.

## B.2 Numérotation des lots

- Format `formatLotNumber(seq, type, année)` : `%04d` + `OC|OB` + année sur 2 chiffres.
- À la création, la séquence est calculée par entreprise et année comme le maximum existant plus un. Un verrou transactionnel PostgreSQL évite deux attributions identiques; les numéros supprimés ne sont pas réutilisés. `nextFreeDeliverySequences` reste limité à la prévisualisation et à l'import journalier.
- Le numéro est attribué à l'enregistrement (`assignNumbersOnCreate`) ; le formulaire n'affiche qu'une prévisualisation (`GET /next-numbers`).

## B.3 Calculs

| Grandeur | Où | Règle |
|---|---|---|
| Poids net | Frontend | Poids chargé − poids vide ; le backend reprend la valeur reçue |
| Rendement | Frontend | Huile ÷ poids net × 100 ; le backend stocke la valeur reçue |
| Prix de trituration | Frontend | Grille `SEASON_PRICING_RULES` (date, variété), sinon `PRIX_TRITURATION_KG` ; le backend ne fait que l'imprimer |
| Prix olives | Backend | `prix unitaire × poids net` (`updateprice`) |
| Prix huile | Backend | `prix unitaire × quantité d'huile` |
| Paiement | Backend | Montant plafonné au reste dû ; `paid` quand le reste vaut 0 ; arrondi à 3 décimales |
| Coût moyen de cuve | Backend | Moyenne pondérée arrondie à 2 décimales |

## B.4 Constats

Gravité : **Critique** = sécurité ou données fausses à grande échelle ; **Élevée** = données fausses ou fonction inopérante ; **Moyenne** = incohérence visible ou risque ; **Faible** = finition.

### Sécurité et intégrité des données

| N° | Gravité | Constat | Correction proposée |
|---|---|---|---|
| R-01 | Corrigé | Les opérations d'écriture des réceptions, de la planification et du contrôle qualité sont protégées par action serveur (`@PreAuthorize`). | Les endpoints de lecture restent à examiner pour éviter de bloquer les rôles de contrôle qualité et de planification. |
| R-02 | Corrigé | Les accès aux réceptions, au prix, au paiement, au contrôle qualité et à la planification passent par des recherches limitées à l'entreprise. | Le périmètre est la réception; les entités Production hors réception restent couvertes par l'annexe C. |
| R-03 | Corrigé | La numérotation est désormais par entreprise et année, sans réutilisation, protégée par verrou transactionnel PostgreSQL. | Les tests unitaires passent; la requête native reste à confirmer sur une base PostgreSQL réelle. |
| R-04 | Corrigé | Les changements d'état, de prix et la création de réception d'huile utilisent POST; seules les transitions d'annulation autorisées sont acceptées et le motif est conservé. | La validation métier reste contrôlée côté serveur. |
| R-05 | Corrigé | La création d'un mouvement `RECEPTION_IN` vérifie qu'aucune entrée n'existe déjà pour la réception. | Les scénarios d'import restent couverts par les tests DayImport. |
| R-06 | Corrigé | Une jambe huile non annulée bloque toute création supplémentaire et l'action est masquée lorsqu'elle existe. | — |
| R-07 | Corrigé | La suppression est limitée aux états compatibles, refusée lorsqu'un paiement existe et l'ancienne suppression physique est remplacée par une suppression logique. | Les mouvements de stock liés ne sont plus supprimés sans contrôle. |

### Calculs et règles métier

| N° | Gravité | Constat | Correction proposée |
|---|---|---|---|
| R-08 | Corrigé | Les choix Paiement en huile et mixte ont été retirés du panneau; celui-ci ne règle que le solde en argent et explique le parcours séparé pour la part huile. | Les traductions fr/en/ar sont fournies. |
| R-09 | Corrigé | La finalisation ne recalcule le prix unitaire que pour la trituration particulier, avec contrôles de données et de division par zéro. | — |
| R-10 | Corrigé | Les heures du moulin sont calculées comme les heures existantes plus les minutes converties en heures, avec valeurs nulles sûres. | Le champ métier reste un nombre entier: les minutes sont arrondies. |
| R-11 | Moyenne | Poids net, rendement et prix de trituration viennent du navigateur et ne sont jamais recalculés côté serveur. | Recalculer et contrôler côté serveur. |
| R-12 | Moyenne | Le contrôle qualité bloque l'enregistrement d'un lot non conforme : pas de parcours **Refusé**. | Permettre l'enregistrement avec statut Refusé et motif. |
| R-13 | Moyenne | Import : les olives sont valorisées `quantité d'huile × prix` alors que l'écran utilise `poids net × prix` ; tare artificielle de 1 kg (poids brut 0), matricule et nombre de sacs non importés ; un type d'opération invalide n'est détecté qu'à l'import final. | Aligner la valorisation ; importer poids brut, matricule, sacs ; valider le type au contrôle. |
| R-14 | Moyenne | Paiement : dépassement plafonné silencieusement côté serveur, pas de maximum réel côté écran. Paiement en huile : aucun contrôle `quantité × prix = montant`. | Refuser explicitement le dépassement ; contrôler la cohérence. |
| R-15 | Moyenne | Les messages d'erreur métier (« Payment amount exceeds remaining unpaid balance », « Unit price must be positive »…) arrivent comme erreur 500 sans texte ; `createOilRecFromOliveRec` renvoie ses erreurs en HTTP 200. | Exceptions métier en 400/422 avec message traduit. |
| R-16 | Moyenne | Horaires de réception et tonnage journalier : simples avertissements côté écran, jamais contrôlés côté serveur. | Décider s'il s'agit d'un blocage ; si oui, contrôler côté serveur. |
| R-17 | Moyenne | Lot global : enregistré Terminé puis remis à Nouveau, marqué payé tout en portant la somme des impayés. | Revoir la création du lot global. |
| R-18 | Moyenne | Planning : le regroupement retire les cartes avant de vérifier si le moulin est bloqué ; les cartes peuvent disparaître. L'entité `MachinePlan` (créneaux horaires) n'est pas utilisée. | Vérifier avant de modifier ; décider du sort de `MachinePlan`. |

### Écrans et droits

| N° | Gravité | Constat | Correction proposée |
|---|---|---|---|
| R-19 | Corrigé | Les routes fournisseur utilisent READ pour la consultation; les routes `new` exigent CREATE et sont placées avant les routes d'édition; le menu exige aussi CREATE pour les entrées de saisie. | Voir L-01 pour le détail des gardes. |
| R-20 | Moyenne | L'option **Dispose d'un espace de stockage** n'existe pas dans le formulaire fournisseur, alors que le transfert d'huile vers la cuve du client en dépend. | Ajouter le champ et le choix de la cuve. |
| R-21 | Moyenne | Fiche fournisseur : les totaux des cartes ne portent que sur la première page (10 lignes, 25 pour la base) ; l'onglet Finance peut ne pas se charger avec `?tab=finance` (rafraîchissement appelé avant création de la liste). Listes payées/impayées et compteurs utilisent des filtres différents. | Totaux calculés par le serveur ; corriger l'ordre d'initialisation. |
| R-22 | Moyenne | Tableau de bord : la mini-carte « Total Réceptions » affiche le montant payé ; « Réceptions en attente » ne compte que En cours ; « Volume total (KG) » additionne l'huile quel que soit le type. | Corriger les indicateurs. |
| R-23 | Faible | Action **Regenerate QR** envoyée par le serveur sans libellé, aboutit à « Action non reconnue ». | Ajouter le libellé et le traitement. |
| R-24 | Faible | Formulaire olives : l'erreur « poids vide supérieur au poids chargé » ne s'affiche jamais (mauvaise clé) ; plusieurs clés d'erreur non traduites (FILL_REQUIRED, INVALID_SUPPLIER) ; OC/OB jamais expliqués à l'écran. | Corriger les clés ; infobulle OC/OB. |
| R-25 | Faible | Réception d'huile : badge toujours « Achat d'huile » ; quantité en kg dans le formulaire mais en L dans le bandeau et sur les factures ; redirection vers `/reception-huile` au lieu de `/reception/reception-huile`. | Unifier l'unité (kg) et corriger badge et redirection. |
| R-26 | Faible | Fournisseur : Nom et Prénom inversés (`lastname` affiché « Prénom », colonne « Prénom » = nom complet) ; message « 8 chiffres » pour un contrôle à 6 caractères ; message RIB « 24 chiffres » sans contrôle ; adresse obligatoire seulement en popup. Deux entités fournisseur (production et finance). | Corriger libellés et contrôles ; unifier l'entité. |
| R-27 | Faible | Fiche réception : type OLIVE/OIL brut ; confirmation QR « D'ACCORD » alors que l'indication dit « OK » ; pas de bouton retour. Export CSV du journal olives nommé `oil_receptions`. | Corrections mineures. |
| R-28 | Faible | Planification : message « planification désactivée » qui parle de SPRINGDOC ; libellé du moulin manquant dans la finalisation ; messages de succès du planning en anglais. | Corriger les traductions. |

### Libellés et traductions

| N° | Gravité | Constat |
|---|---|---|
| R-29 | Moyenne | `fr.json` contient du texte arabe et un mot russe (`SUPPLIERS.USERS`, `WASTE*`, `TRANSACTIONS.FIELDS…`) ; `SUPPLIER_PAYMENT.ERRORS.AMOUNT_MAX` est en anglais. |
| R-30 | Faible | Orthographe : « Paier », « Paiment », « Montant umpaié », « Montant non paié », « Montant à Payé », « Redement », « Referance », « Tendence des achat », « Poid camion chargé », « Unité destiantion », « Confirmer la mouvment », « Crée un lot global », « Reception est annulé ». |
| R-31 | Faible | Mélange anglais/français : « Control quality terminé », « Quality control d'olive », « Bon control quality », « Parcel », « Mill machine », « Lot, supplier, global lot… », « Unit Price (BASE) ». |
| R-32 | Faible | « Prix total (€) » au lieu de TND ; « Echange » / « Achat d'olive » dans les listes contre « Échange » / « Achat d'olives » dans le menu ; « Fournisseurs & apporteurs » (menu), « Agriculteurs » (liste), « Ajouter un agriculteur » (formulaire). |
| R-33 | Faible | Types d'huile de l'échange codés en dur (Extra Vierge, Vierge, Lampante) au lieu de la liste paramétrée. |

## B.5 Recommandations pour la formation

- Tant que R-12 n'est pas corrigé, annuler (avec motif) un lot non conforme.
- R-01 à R-10 et R-19 sont corrigés dans le périmètre Réception. Les résidus documentés dans le tableau doivent être vérifiés en recette, notamment les accès de lecture et la requête de numérotation PostgreSQL.
