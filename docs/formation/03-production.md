# Chapitre 3 — Unité de Production

**Objectif :** maîtriser le contrôle qualité, les unités de stockage, les mouvements d'huile, la filtration, les contenants et les machines de trituration.

**Durée conseillée en formation :** 90 minutes.

> **Attention :** ce chapitre décrit le fonctionnement observé le 28 septembre 2026. Les limites techniques et les actions à éviter sont regroupées dans la revue à la fin du document.

## 3.1 Parcours général

Le groupe **Unité de Production** contient deux rubriques :

- **Contrôle qualité** : contrôle qualité d'olive et contrôle qualité d'huile.
- **Stockage & flux huile** : unités de stockage d'huile, transactions huile, filtrage huile et contenants huile.

Les critères de contrôle se règlent dans **Paramètres système › Critères de contrôle qualité**. Les machines utilisées pendant la trituration se règlent dans **Paramètres système › Machines de trituration**.

Le parcours normal suit cette séquence :

1. Enregistrer ou recevoir un lot.
2. Effectuer le contrôle qualité.
3. Affecter l'huile à une unité de stockage.
4. Suivre les entrées, sorties, transferts, ventes, échanges et prêts dans les transactions.
5. Enregistrer une filtration si nécessaire.
6. Suivre les contenants destinés au conditionnement ou à la vente.

## 3.2 Contrôle qualité des olives

L'écran **Contrôle qualité d'olive** présente les lots d'olives à contrôler et les résultats déjà enregistrés. Les filtres portent notamment sur le numéro de lot, le fournisseur, la variété, le statut et la période.

### Enregistrer un contrôle

1. Ouvrir le lot depuis la liste.
2. Vérifier les informations de réception.
3. Saisir les mesures demandées par les règles actives pour les olives.
4. Renseigner les champs obligatoires signalés par l'interface.
5. Vérifier le résumé de conformité.
6. Enregistrer le contrôle.

Une règle peut être numérique, booléenne ou textuelle. Une règle numérique compare la mesure à une valeur minimale et/ou maximale. Le résultat global est calculé à partir des règles applicables.

Les valeurs hors limites peuvent être enregistrées. Elles restent visibles comme non conformes dans le résumé et déclenchent le traitement de non-conformité côté serveur.

## 3.3 Contrôle qualité de l'huile

L'écran **Contrôle qualité d'huile** regroupe les lots d'huile à analyser. Le fonctionnement de saisie est identique au contrôle des olives, avec les règles propres à l'huile.

Les mesures principales utilisées pour proposer une catégorie sont :

| Mesure | Rôle |
|---|---|
| Acidité | Indicateur chimique principal de la catégorie d'huile |
| K232 | Oxydation primaire |
| K270 | Oxydation secondaire |
| Delta K | Anomalies spectrophotométriques |
| Indice de peroxyde | Niveau d'oxydation |

L'application peut proposer une catégorie telle que **Extra vierge**, **Vierge** ou **Lampante** selon les seuils configurés. La catégorie choisie par l'opérateur reste toutefois prioritaire dans l'implémentation actuelle.

Lorsque les mesures chimiques nécessaires sont présentes, la catégorie calculée côté serveur prévaut sur une catégorie textuelle saisie manuellement.

## 3.4 Critères de contrôle qualité

La page **Paramètres système › Critères de contrôle qualité** permet de gérer les règles utilisées dans les écrans de contrôle.

Chaque règle contient notamment :

- un nom et une clé technique ;
- une indication d'application aux olives ou à l'huile ;
- un type de valeur : numérique, oui/non ou texte ;
- une valeur minimale et/ou maximale pour une règle numérique ;
- l'ordre d'affichage et l'état actif.

Le bouton **Charger les règles Tunisia par défaut** crée le jeu de critères standard prévu par l'application.

> **Attention :** ne pas modifier les clés techniques Acidite, K232, K270, DeltaK et Peroxide sans validation technique. La proposition de catégorie dépend de ces clés. Vérifier aussi que le minimum ne dépasse pas le maximum.

## 3.5 Unités de stockage d'huile

L'écran **Unités de stockage d'huile** représente les cuves et réservoirs disponibles. La liste affiche les informations d'identification, la capacité, le volume courant, le type d'huile, l'état, l'indication d'huile filtrée et les informations de coût ou de propriétaire disponibles.

### Créer une unité

Le formulaire contient principalement :

1. le code et le nom de l'unité ;
2. la capacité ;
3. le volume actuel ;
4. le type ou la catégorie d'huile ;
5. l'état de l'unité ;
6. l'indication d'huile filtrée ;
7. les informations complémentaires de stockage.

La capacité et le volume sont exprimés en kilogrammes dans le module de stockage. Le volume courant doit rester compris entre zéro et la capacité.

### Affecter une cuve à un fournisseur

Une unité peut être liée à un fournisseur lorsque l'huile lui appartient. Utiliser l'action d'affectation depuis la liste ou la fiche de l'unité. Une même affectation ne doit pas créer deux cuves actives pour le même fournisseur.

> **Attention :** **Volume actuel** est en lecture seule. Une correction doit passer par un mouvement traçable. La modification d'une cuve préserve le coût moyen, le coût total, le fournisseur et les dates techniques.

## 3.6 Transactions d'huile

La page **Transactions huile** centralise les mouvements de stock.

| Type | Effet attendu |
|---|---|
| Réception | Ajoute l'huile dans une cuve de destination |
| Transfert | Retire une quantité de la source et l'ajoute à la destination |
| Échange | Déplace l'huile selon la validation de l'échange |
| Vente | Retire l'huile de la cuve source |
| Prêt | Retire ou affecte une quantité selon le sens du prêt |
| Filtration | Trace le passage entre la cuve source et la cuve filtrée |

Les états principaux sont **En attente**, **Terminée** et **Annulée**. Une transaction en attente doit être validée une seule fois. Les volumes et le coût moyen pondéré des cuves sont recalculés lors des mouvements pris en charge par le serveur.

Le formulaire de transfert impose maintenant une source et une destination. Une transaction ne peut être approuvée que depuis l'état **En attente**. La suppression restaure les volumes pour les opérations autorisées et refuse les transactions liées à une vente.

## 3.7 Filtration de l'huile

La page **Filtrage Huile** suit les opérations de filtration depuis leur préparation jusqu'à leur achèvement.

### Créer une filtration

1. Cliquer sur l'action de création.
2. Choisir la cuve source.
3. Choisir une cuve cible distincte, disponible et identifiée comme contenant de l'huile filtrée.
4. Saisir le volume à filtrer.
5. Enregistrer l'opération.
6. Démarrer l'opération au moment réel du traitement.
7. À la fin, saisir le volume obtenu et les pertes ou lies.
8. Terminer l'opération.

Les états exposés par l'application comprennent la préparation, le démarrage, la fin et l'annulation. La traçabilité conserve les lots source et cible ainsi que les volumes avant et après filtration.

> **Attention :** la filtration utilise des litres alors que les cuves utilisent des kilogrammes, sans conversion automatique. Une filtration terminée ne peut plus être supprimée. Vérifier que la cuve cible est vide ou compatible, car la fin de filtration peut encore écraser ses informations de lot, de catégorie et de variété.

## 3.8 Contenants d'huile

La page **Contenants huile** gère les bouteilles, bidons et autres formats utilisés pour le conditionnement ou la vente. Une fiche contient le nom, le volume unitaire, la quantité en stock, le prix d'achat et une description.

L'action d'achat augmente la quantité disponible. Le dernier prix d'achat remplace actuellement le prix précédent ; il ne constitue pas un prix moyen pondéré.

> **Attention :** ne pas utiliser la modification directe de la quantité pour enregistrer un achat ou une consommation. La vente contrôle désormais le stock avant décrément. Renseigner une description avant d'enregistrer une modification afin d'éviter l'erreur liée à une valeur vide.

## 3.9 Machines de trituration

La page **Machines de trituration** permet de créer et consulter les machines utilisées pendant la production. Les informations comprennent le nom, l'identification, la capacité, les heures de fonctionnement, l'état et les informations de maintenance.

Les états métier observés sont **Opérationnelle**, **Inactive**, **Maintenance** et **Hors service**. La disponibilité peut être recalculée à partir des ordres de maintenance.

Le recalcul de disponibilité préserve désormais les états **Inactive** et **Hors service**. L'écran utilise les mêmes valeurs d'état que le serveur.

## 3.10 Tableau de bord Stockage

L'onglet **Stockage** du tableau de bord donne une synthèse des cuves, volumes et mouvements. Les indicateurs servent au suivi opérationnel ; la transaction et la fiche de cuve restent les sources à consulter avant une correction de stock.

## 3.11 Droits d'accès

L'affichage des pages dépend du module souscrit et des permissions du rôle. Les permissions concernent notamment les unités de stockage, les transactions, les contrôles qualité et les paramètres.

Les opérations génériques et les endpoints métier principaux contrôlent désormais les permissions côté serveur. Les recherches sensibles vérifient aussi l'entreprise propriétaire. La matrice complète des rôles doit rester couverte par les tests de recette.

## 3.12 Questions fréquentes

**Pourquoi aucune règle n'apparaît dans le contrôle qualité ?**  
Aucune règle active correspondant au type du lot n'est configurée pour l'entreprise. Vérifier **Critères de contrôle qualité**.

**Pourquoi une cuve n'apparaît pas dans la filtration ?**  
La cuve cible doit être disponible et marquée comme contenant de l'huile filtrée. La source doit disposer d'un volume suffisant.

**Pourquoi le volume ne doit-il pas être corrigé dans la fiche de cuve ?**  
Cette modification ne crée ni mouvement, ni justification, ni historique fiable. Une correction doit passer par un mécanisme de stock traçable.

**Pourquoi une catégorie QC paraît incohérente ?**  
La catégorie choisie peut actuellement remplacer la proposition issue des mesures. Comparer Acidité, K232, K270, Delta K et indice de peroxyde aux seuils applicables.

**Pourquoi une machine redevient-elle opérationnelle ?**  
Le service de disponibilité réécrit actuellement certains états lors de l'actualisation. Ce comportement est un défaut connu.

# Annexe C — Revue technique et fonctionnelle de l'Unité de Production

Cette revue en lecture seule a été réalisée le 28 septembre 2026 sur le frontend Angular `F:/osm-ms-fe` et le backend Spring Boot `F:/oosm`. Une première vague de corrections a été appliquée le 29 septembre 2026.

### État de la vague du 29 septembre 2026

- **Corrigés :** C-01, C-03, C-04, C-06 à C-10, C-12, C-14, C-18, C-19, C-25, C-26, C-28, C-31, C-34 et C-35.
- **Partiellement corrigé :** C-02. Les accès génériques et les parcours Production principaux sont isolés par tenant ; l'audit doit encore couvrir les services périphériques restants.
- **Restent ouverts :** les autres constats, notamment les actions de liste de filtration, l'unification des unités, les règles de mélange, les enums persistés par ordinal, les doublons QC et les traductions.

## C.1 Priorités immédiates

| N° | Gravité | Constat | Référence principale |
|---|---|---|---|
| C-01 | Critique | Les contrôleurs Production exposent des opérations sans autorisation serveur systématique. Les gardes Angular ne protègent pas l'API. | `modules/production/**/controller` |
| C-02 | Critique | Plusieurs lectures et mises à jour par identifiant ne vérifient pas le tenant. Un identifiant connu peut viser les données d'une autre entreprise. | `BaseServiceImpl.java`, services stockage/QC/filtration |
| C-03 | Élevée | `DELETE /remove/{id}` est ouvert au niveau du contrôleur générique et effectue une suppression dure sans les règles métier de restauration. | `BaseController.java:47`, `BaseServiceImpl.java:350` |
| C-04 | Élevée | Les endpoints génériques de filtration contournent les contrôles de volume et d'état. | `FiltrationDashService.java` |
| C-05 | Élevée | La liste de filtration affiche huit actions sans respecter les permissions ni l'état de la ligne. | `oosm-dashboard.ts:263`, `filtration-dashboard.config.ts` |

## C.2 Transactions et stockage

| N° | Gravité | Constat | Correction requise |
|---|---|---|---|
| C-06 | Critique | Supprimer une transaction avec cuve source provoque un `NullPointerException` sur le prix unitaire nul. | Corriger le calcul de restauration et couvrir transfert, vente, prêt et échange par des tests. |
| C-07 | Élevée | Une approbation répétée ou concurrente déplace le stock plusieurs fois ; l'état PENDING n'est pas exigé et la transaction n'est pas versionnée. | Verrouiller l'approbation, exiger PENDING et ajouter l'idempotence. |
| C-08 | Critique | Modifier une cuve remet le coût moyen et le coût total à zéro, supprime le fournisseur et efface les dates non présentes dans le DTO. | Faire une mise à jour partielle explicite et préserver les champs absents. |
| C-09 | Élevée | Le formulaire Transfert désactive les deux listes de cuves et peut enregistrer un transfert sans source ni destination. | Réactiver les champs et imposer les validations côté serveur. |
| C-10 | Élevée | Le mouvement de stock ne dépend pas toujours de l'état ; une transaction PENDING peut être comptée à la création puis à l'approbation. | Centraliser le mouvement dans une transition atomique unique. |
| C-11 | Élevée | La validation de vente filtre les cuves selon l'espace libre au lieu du volume disponible. | Comparer la quantité vendue au volume courant. |
| C-12 | Élevée | La modification et la suppression depuis la fiche appellent des routes backend inexistantes. | Aligner `OilTransactionService.ts` sur les routes serveur. |
| C-13 | Moyenne | Type et état sont stockés par ordinal d'enum. Une réorganisation change la signification des données existantes. | Stocker les enums par nom. |
| C-14 | Moyenne | Le volume courant d'une cuve est directement éditable sans transaction ni audit. | Interdire l'édition directe et créer une opération d'ajustement tracée. |
| C-15 | Moyenne | Une cuve contenant de l'huile ou liée à une transaction en attente peut être supprimée. | Bloquer la suppression selon le stock et les dépendances. |
| C-16 | Moyenne | La réaffectation d'un fournisseur ne libère pas toujours l'ancienne cuve et peut violer l'unicité. | Gérer l'affectation dans une transaction serveur. |
| C-17 | Moyenne | Les listes et libellés utilisent des vocabulaires divergents pour les catégories, types et états. | Définir des enums et traductions communs. |

## C.3 Filtration

| N° | Gravité | Constat | Correction requise |
|---|---|---|---|
| C-18 | Élevée | `validateRequest` n'est pas appelée à la création ; source=cible et volume nul ou négatif peuvent être envoyés à l'API. | Exécuter les validations dans le service transactionnel. |
| C-19 | Élevée | Supprimer une filtration terminée ne restaure pas les stocks et laisse transaction et traçabilité. | Interdire la suppression ou implémenter une annulation complète et auditée. |
| C-20 | Élevée | La perte d'huile disparaît du coût comptable et la cuve cible peut voir son lot, sa catégorie et sa variété écrasés. | Définir la valorisation des pertes et les règles de mélange. |
| C-21 | Moyenne | La cuve cible doit déjà être marquée « huile filtrée », sans parcours explicite. | Clarifier le sens du champ et automatiser l'état approprié. |
| C-22 | Moyenne | Aucun parcours ne produit réellement l'état CANCELLED. | Ajouter la transition et ses effets, ou retirer l'état. |
| C-23 | Moyenne | Les erreurs de fin retournent toutes 500 et l'action Démarrer ignore les erreurs. | Utiliser les statuts HTTP métier et afficher les messages. |
| C-24 | Moyenne | Filtration en litres et stockage en kilogrammes sont mélangés sans densité ni conversion. | Choisir une unité de référence et tracer la conversion. |

## C.4 Contrôle qualité

| N° | Gravité | Constat | Correction requise |
|---|---|---|---|
| C-25 | Critique | Les résultats non conformes ne peuvent pas être enregistrés : le backend refuse la mesure et le frontend exige 100 % de conformité. | Stocker la mesure, calculer la non-conformité et piloter le workflow de décision. |
| C-26 | Élevée | La catégorie choisie par l'opérateur peut remplacer une catégorie moins favorable déduite des mesures. | Calculer et contrôler la catégorie côté serveur. |
| C-27 | Moyenne | Le serveur accepte des sauvegardes QC en double et ne vérifie pas la correspondance olive/huile de la règle. | Ajouter unicité, idempotence et contrôle du type de règle. |
| C-28 | Moyenne | Une règle oui/non ne compare pas la réponse à la valeur attendue. | Intégrer l'attendu au calcul de conformité. |
| C-29 | Moyenne | Le formulaire autorise un type vide, min>max et la modification des clés utilisées par le classement. | Valider le modèle côté client et serveur ; protéger les clés système. |
| C-30 | Moyenne | Plusieurs liens et méthodes de services frontend appellent des routes absentes ; `/fetchAll` échoue. | Supprimer le code mort ou implémenter les endpoints contractuels. |

## C.5 Contenants et machines

| N° | Gravité | Constat | Correction requise |
|---|---|---|---|
| C-31 | Élevée | Une vente peut faire passer le stock de contenants sous zéro. | Verrouiller et contrôler le stock avant décrément. |
| C-32 | Moyenne | La quantité est directement éditable et le dernier achat remplace le prix au lieu de calculer un coût moyen. | Passer par des mouvements et définir la méthode de valorisation. |
| C-33 | Moyenne | Une description nulle provoque une erreur `.trim()` à l'enregistrement ; l'erreur est silencieuse. | Normaliser les valeurs nulles et afficher l'erreur. |
| C-34 | Élevée | Le recalcul de disponibilité remet OUT_OF_SERVICE ou INACTIVE à OPERATIONAL. | Préserver les états administratifs et ne calculer que la disponibilité. |
| C-35 | Moyenne | Le frontend et le backend utilisent ACTIVE, OPERATIONAL, INACTIVE, MAINTENANCE et OUT_OF_SERVICE de manière incohérente. | Partager un enum contractuel et migrer les données. |

## C.6 Accès, routes et interface

| N° | Gravité | Constat |
|---|---|---|
| C-36 | Moyenne | Les gardes sont incohérentes : critères QC sans garde suffisante, édition filtration accessible avec READ, stockage utilisé pour filtrations et contenants. |
| C-37 | Élevée | Supprimer depuis la liste QC olives supprime la réception elle-même selon les permissions UNIFIEDDELIVERY. |
| C-38 | Moyenne | Plusieurs routes générées par le backend n'existent pas dans le frontend. |
| C-39 | Moyenne | La liste des transactions omet FILTRATION et CANCELED ; OIL_SALE et SALE divergent. |
| C-40 | Moyenne | Des clés françaises manquent ; l'utilisateur voit des clés brutes et des messages incomplets. |
| C-41 | Faible | Des libellés mélangent français et anglais ou contiennent des fautes : « Mouvments », « destiantion », « Paier », « Tracabilite ». |
| C-42 | Faible | Les titres du menu et des écrans divergent pour stockage, transactions, filtration, contenants et contrôle qualité. |
| C-43 | Faible | Des textes français sont codés en dur, empêchant leur traduction. |
| C-44 | Faible | L'unité de capacité des machines n'est pas affichée. |
| C-45 | Moyenne | La concurrence n'est protégée que partiellement : cuves et contenants ont une version, transactions et filtrations non. |

## C.7 Ordre de correction

1. Fermer C-01 à C-04 : autorisations serveur, isolation tenant et suppression générique.
2. Corriger C-06 à C-10 : intégrité et idempotence des mouvements d'huile.
3. Corriger C-25 et C-26 : enregistrer réellement les non-conformités et calculer la catégorie côté serveur.
4. Corriger C-18 à C-20 : création, fin et annulation de filtration.
5. Corriger C-08, C-14 à C-16 : édition, ajustement et suppression des cuves.
6. Corriger C-31 à C-35 : stock de contenants et états machine.
7. Aligner les routes, gardes, unités, enums et traductions.

## C.8 Conditions de recette minimales

- Vérifier deux tenants avec des identifiants connus de l'autre tenant sur chaque lecture, mise à jour et suppression.
- Vérifier chaque endpoint avec aucun droit, READ seul, CREATE, UPDATE, DELETE et permissions métier.
- Exécuter deux approbations simultanées sur la même transaction ; un seul mouvement doit être créé.
- Enregistrer un résultat QC conforme puis non conforme ; les deux doivent rester consultables avec leur décision.
- Terminer puis annuler une filtration ; volumes, coûts, lots et traçabilité doivent revenir à un état cohérent.
- Modifier une cuve sans envoyer les champs calculés ; coût, fournisseur et dates doivent être préservés.
- Tester les stocks de contenants à zéro et deux ventes simultanées.
- Vérifier qu'une machine inactive ou hors service conserve son état après recalcul de disponibilité.
