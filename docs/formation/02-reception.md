# Chapitre 2 — Réception

**Objectif :** à la fin de ce chapitre, l'utilisateur sait enregistrer une réception d'olives pour chacun des quatre types d'opération, suivre le lot jusqu'à la trituration et au paiement, enregistrer une réception d'huile, consulter les journaux, importer une journée depuis Excel et gérer les fournisseurs.

**Durée conseillée en formation :** 2 h 30 (dont 1 h de cas pratiques).

**Droits nécessaires :** module Réception activé pour l'entreprise ; droits sur les réceptions (lecture, création, modification, contrôle qualité, prix, paiement, planification) et sur les fournisseurs. Voir aussi l'annexe B, point R-01.

## 2.1 Vocabulaire à expliquer au client

| Terme | Signification |
|---|---|
| Réception | L'arrivée d'une livraison (olives ou huile) à l'huilerie. Chaque réception reçoit un numéro de réception et un numéro de lot. |
| Lot | L'identifiant de traçabilité de la réception, par exemple `0001OC26` : numéro d'ordre sur 4 chiffres, type (OC ou OB), année sur 2 chiffres. |
| OC / OB | Type d'olive ou d'huile : conventionnelle (OC) ou biologique (OB). |
| Lot global | Regroupement de plusieurs lots triturés ensemble. Son numéro commence par G. |
| Trituration | Le broyage des olives pour produire l'huile. |
| Rendement | Huile produite ÷ poids net d'olives × 100. |
| Apporteur, agriculteur, fournisseur | La personne qui apporte les olives ou l'huile. L'application utilise ces trois mots pour la même fiche. |

## 2.2 Les quatre types de réception d'olives

Le menu **Réception › Nouvelles réceptions › Réception d'olives** propose quatre types. Le formulaire de saisie est le même pour les quatre ; ce qui change, c'est la suite du parcours et le sens du paiement.

| | Trituration particulier | Trituration sur base | Achat d'olives | Échange |
|---|---|---|---|---|
| Situation | Le client fait triturer ses olives et récupère son huile | Le fournisseur livre ses olives « sur base » ; l'huilerie garde l'huile et le paie | L'huilerie achète les olives | Le client échange ses olives contre de l'huile déjà en stock |
| Le formulaire parle de | Client | Fournisseur | Fournisseur | Client |
| Après le contrôle qualité olives | Contrôle qualité terminé | **Prêt pour production** directement | Contrôle qualité terminé | Contrôle qualité terminé |
| Prix à définir avant production | Non | Non | Oui : prix par kg d'olives | Oui : prix des olives et huile remise en échange |
| À la fin de la trituration | Le prix de trituration devient le montant dû par le client | Une réception d'huile est créée automatiquement | Une réception d'huile est créée automatiquement | Une réception d'huile est créée automatiquement |
| Sens du paiement | Le client paie l'huilerie (entrée) | L'huilerie paie le fournisseur (sortie) | L'huilerie paie le fournisseur (sortie) | Le client est réglé en huile (entrée) |

> **Astuce :** pour expliquer les quatre types, partir de la question « à qui appartient l'huile à la fin ? » : au client (particulier), à l'huilerie qui paie les olives (base, achat), ou au client qui repart avec de l'huile du stock (échange).

## 2.3 Le parcours d'un lot d'olives

Un lot d'olives passe par les statuts suivants. Le statut est affiché dans chaque liste et sur la fiche de la réception.

| Statut affiché | Signification | Étape suivante |
|---|---|---|
| En attente | Camion pesé à l'arrivée, pesée à vide pas encore faite | Modifier la réception et saisir le poids du camion vide |
| Nouveau | Pesée complète | Contrôle Qualité Olives |
| Contrôle qualité terminé | Contrôle qualité enregistré | Définir le prix (achat, échange) ou planifier |
| Prêt pour production | Prêt à être trituré | Planification ou Terminer |
| En cours | Affecté à un moulin sur le planning | Finaliser le lot |
| Terminé | Trituration terminée, huile produite saisie | Paiement, réception d'huile |
| En stock | Huile entrée en cuve | — |
| Annulé | Réception annulée (avec un motif) | — |

![Parcours d'un lot d'olives](images/02-reception/01-parcours-lot.png)

Les actions proposées sur une ligne (clic sur les trois points ou double-clic pour ouvrir la fiche) dépendent du statut, du type et des droits de l'utilisateur. Un utilisateur ne voit que les actions autorisées par son rôle.

## 2.4 Enregistrer une réception d'olives

**Menu :** Réception › Nouvelles réceptions › Réception d'olives › (type).

La page affiche d'abord la liste des réceptions en cours pour ce type (**Historique Réceptions Olives**). Le bouton **Nouveau** ouvre le formulaire **Ajouter une réception d'olives**.

![Formulaire de réception d'olives](images/02-reception/02-formulaire-olives.png)

### Informations de réception

1. **N° réception** et **Numéro de lot** : calculés automatiquement, non modifiables. Ils sont confirmés à l'enregistrement et peuvent changer si un autre utilisateur enregistre une réception au même moment.
2. **Date** : la date du jour par défaut.
3. **Matricule du camion** : obligatoire, au format tunisien, par exemple `258TN1234`.

### Client (ou fournisseur) et région

4. **Client** ou **Fournisseur** : choisir dans la liste. Le bouton **+** crée un nouvel agriculteur sans quitter la réception (voir 2.12). Le choix remplit automatiquement la région.
5. **Région** : obligatoire. Le bouton **+** ajoute une région.
6. **Parcelle** (libellé « Parcel ») : obligatoire.

### Informations sur les olives

7. **Type d'olive** : OC ou OB. Le numéro de lot se met à jour.
8. **Poids camion chargé (kg)**.
9. **Poids camion vide** : peut rester à 0 si le camion n'est pas encore repassé sur la bascule.
10. **Nombre de sacs** : obligatoire.
11. **Poids net (kg)** : calculé = poids chargé − poids vide.

Cliquer sur **Ajouter**.

- Si le poids du camion vide est renseigné, la réception est au statut **Nouveau**.
- Sinon elle est **En attente**. Au retour du camion, ouvrir la réception avec **Modifier**, saisir le poids vide et enregistrer : elle passe à **Nouveau**.

> **Remarque :** l'application prévient, sans bloquer, si la réception est saisie hors des horaires de réception ou si le tonnage journalier maximal serait dépassé. Ces limites se règlent dans les paramètres de l'entreprise.

### Bon de réception

L'action **Générer Bon Réception** imprime le bon à remettre au client ou au chauffeur. Il porte un QR code qui permet de retrouver la réception avec la **Recherche globale**.

## 2.5 Le contrôle qualité des olives

**Action :** **Contrôle Qualité Olives** sur une réception au statut **Nouveau**.

1. Vérifier ou choisir la **Variété d'olive**.
2. Renseigner chaque paramètre du panneau **Paramètres de qualité**. La liste des paramètres et leurs limites se règlent dans **Paramètres système › Qualité & équipements › Critères de contrôle qualité**.
3. Cliquer sur **Enregistrer**.

La réception passe à **Contrôle qualité terminé**, ou directement à **Prêt pour production** pour une trituration sur base. Le bon est imprimable avec **Bon contrôle qualité olive**.

> **Attention :** le bouton **Enregistrer** reste grisé tant qu'un paramètre est vide ou hors limites. Un lot non conforme ne peut donc pas être enregistré ni refusé depuis cet écran. En attendant une évolution (annexe B), annuler la réception avec un motif.

## 2.6 Définir le prix (achat d'olives et échange)

**Action :** **Définir le prix** sur une réception au statut **Contrôle qualité terminé**.

![Fenêtre Définir le prix, cas de l'échange](images/02-reception/03-definir-prix.png)

- **Prix unitaire (TND/kg)** des olives : obligatoire, supérieur à 0. Le **Prix total** est calculé (prix × poids net).
- Pour un **Échange**, la partie **Échange** précise l'huile remise au client : type d'huile, prix unitaire de l'huile et quantité d'huile. La valeur de l'huile est toujours égale à la valeur des olives : modifier le prix recalcule la quantité, et inversement.

Cliquer sur **Confirmer** : la réception passe à **Prêt pour production**. Pour un échange, un mouvement de sortie d'huile est créé en attente de validation dans les transactions huile ; sa validation sort l'huile de la cuve et solde l'échange.

## 2.7 Planifier la trituration

**Menu :** Réception › Planification › Plannings Trituration. Ce menu n'existe que si la planification est activée pour l'entreprise ; sinon, la trituration se termine directement depuis la liste avec l'action **Terminer** (voir 2.8).

![Planning de trituration](images/02-reception/04-planning.png)

- La colonne **Réceptions non assignées** contient les lots prêts à triturer. Chaque moulin a sa colonne avec la charge et la capacité en kg. Un moulin en maintenance, hors service ou inactif est marqué **Bloqué**.
- Glisser un lot sur un moulin pour l'affecter. Un avertissement apparaît si la capacité est dépassée.
- **Créer un lot global** : sélectionner au moins deux lots de la même colonne et du même type d'opération. Ils seront triturés ensemble ; l'huile sera répartie au prorata du poids.
- **Enregistrer** valide le planning : les lots affectés passent à **En cours**. **Annuler** abandonne les modifications.
- Le bouton d'annulation d'une carte annule la réception, avec un motif obligatoire.

> **Attention :** enregistrer le planning avant de finaliser un lot. Le bouton de finalisation reste désactivé tant qu'il y a des modifications non enregistrées.

> **Remarque :** un achat d'olives ou un échange n'apparaît sur le planning qu'après **Définir le prix**.

## 2.8 Finaliser le lot (fin de trituration)

**Action :** bouton de finalisation sur la carte du planning, ou **Terminer** dans la liste quand la planification est désactivée.

![Fenêtre Finaliser le lot](images/02-reception/05-finaliser-lot.png)

La fenêtre rappelle les informations du lot (numéro, fournisseur, poids, variété, camion). À saisir :

1. **Moulin** utilisé (sélectionné automatiquement s'il n'y en a qu'un).
2. **Huile produite (kg)** : obligatoire.
3. **Rendement (%)** : calculé automatiquement.
4. Pour une trituration particulier : **Prix de trituration (par kg)**, proposé selon la grille tarifaire de la saison (date et variété), et **Prix total de trituration** calculé.
5. **Durée de trituration** : heures et minutes.
6. **Date** et **heure de finalisation**, **Observation finale** (facultative).

Cliquer sur **Terminer** et confirmer. Le lot passe à **Terminé**.

- **Trituration particulier :** le prix total de trituration devient le montant dû par le client. Si le client dispose d'une cuve de stockage à l'huilerie, l'application propose de transférer son huile dans cette cuve (**Oui, confirmer** / **Non, ignorer**).
- **Base, achat d'olives, échange :** une réception d'huile est créée automatiquement au statut **Nouveau** (voir 2.10).

L'action **Générer Bon de Production** imprime le bon de production.

> **Remarque :** pour la base, l'achat et l'échange, la réception d'huile est créée à la finalisation. L'action **Réception Huile** n'est plus proposée lorsqu'une réception d'huile liée existe déjà.

## 2.9 Le paiement

**Action :** **Payer** sur une réception terminée non soldée. Le panneau de paiement s'ouvre à droite (en bas sur mobile).

![Panneau de paiement](images/02-reception/06-paiement.png)

- L'en-tête indique le sens : **Paiement entrant** (le client paie : trituration particulier, échange) ou **Paiement sortant** (l'huilerie paie : base, achat).
- **Paiement en argent** : Espèces, Chèque (numéro obligatoire) ou Virement bancaire (compte obligatoire).
- **Montant** : pré-rempli avec le reste à payer. Le résumé affiche le montant payé, le prix total et le reste.
- **Confirmer le paiement** enregistre une transaction financière liée à la réception. Un paiement partiel est possible ; la réception reste à payer pour le reste.

> **Remarque :** ce panneau règle uniquement le solde en argent. La part réglée en huile est enregistrée dans le parcours **Trituration payée en huile** décrit ci-dessous.

### Trituration payée en huile

1. Sur la réception d'olives **Terminé**, lancer **Contrôle Qualité Huile** et choisir la cuve de destination. Une réception d'huile « paiement » est créée.
2. Sur cette réception d'huile, lancer **À compléter pour paiement** : saisir le prix unitaire, la quantité d'huile retenue et le total. Le total ne peut pas dépasser le reste dû sur le lot d'olives.
3. L'huile entre en cuve, la réception passe à **Prêt à stocker** et le paiement en huile est enregistré.

## 2.10 Réception d'huile

**Menu :** Réception › Nouvelles réceptions › Réception d'huile.

Cette page liste les réceptions d'huile en cours : achats d'huile saisis manuellement et réceptions d'huile créées automatiquement à la fin d'une trituration.

### Saisir un achat d'huile

**Nouveau** ouvre **Ajouter une réception d'huile** : date, matricule, fournisseur, région, parcelle (facultative), **Quantité d'huile (kg)** et **Type d'huile** (OC ou OB). La réception est créée au statut **Nouveau**.

### Parcours d'une réception d'huile

1. **Contrôle Qualité Huile** : choisir la **cuve de destination** (seules les cuves non filtrées et avec assez de place sont proposées) et renseigner les paramètres. Statut **Contrôle qualité terminé**.
2. **Définir le prix** : le prix unitaire est proposé (prix des olives ramené au kg d'huile pour une huile issue d'un lot, sinon le prix de base de l'entreprise). **Valider** : prix total = prix unitaire × quantité, l'huile entre dans la cuve, statut **En stock**.
3. **Payer** et **Générer Facture** pour un achat d'huile non soldé.

> **Remarque :** le formulaire affiche la quantité en kg, mais le bandeau de synthèse l'affiche en litres. L'application enregistre des kilogrammes.

## 2.11 Les journaux

**Menu :** Réception › Journaux.

| Journal | Contenu | Particularités |
|---|---|---|
| Journal réception olives | Réceptions d'olives terminées, en stock, refusées ou annulées | Total du poids net ; filtre par numéro de réception |
| Journal réception huile | Réceptions d'huile terminées, en stock, refusées ou annulées | Même présentation |
| Journal achat | Vue combinée des achats et triturations (olives et huile), sauf annulées | Totaux poids, huile, montants payés et non payés ; case **Soldé** ; action **Générer Facture** |
| Import journalier | Import d'une journée depuis Excel | Voir 2.13 |

Toutes les listes partagent la même barre d'outils : nombre de lignes, **Exporter CSV** et **Exporter PDF** (avec choix des colonnes), **Filtrer**, **Réinitialiser**.

![Journal achat](images/02-reception/07-journal-achat.png)

## 2.12 Fournisseurs et apporteurs

**Menu :** Réception › Fournisseurs & apporteurs. La liste s'intitule **Agriculteurs**.

### Créer un agriculteur

**Nouveau** (ou **+** depuis une réception) ouvre **Ajouter un agriculteur** :

| Champ | Règle |
|---|---|
| Nom, Prénom | Obligatoires, 2 caractères minimum |
| Téléphone | Obligatoire |
| Matricule fiscal | Facultatif |
| Adresse | Obligatoire uniquement lors d'une création depuis une réception |
| Région | Obligatoire |
| Type de fournisseur | Obligatoire ; liste paramétrable (bouton **+**) |
| RIB, Nom de la banque | Facultatifs |

### Fiche et soldes

Un double-clic ouvre la fiche détaillée :

- **Opérations** : une carte par activité (trituration particulier, base, achat d'olives, achat d'huile, échange, grignon, crédit d'huile, ventes d'huile) avec le nombre d'opérations. Cliquer sur une carte affiche la liste correspondante, avec les actions **Payer** et **Générer Facture**. Pour la base, le bloc **Suivi fournisseur Base** récapitule les quantités, le payé et l'impayé.
- **Finance** : montant total, payé, impayé, entrées, sorties et liste des transactions.
- **Profil & banque** : coordonnées et informations bancaires.

![Fiche fournisseur](images/02-reception/08-fiche-fournisseur.png)

> **Attention :** le total affiché sur les cartes d'activité ne porte aujourd'hui que sur la première page de la liste. Pour un solde fiable, utiliser l'onglet **Finance**.

## 2.13 Import journalier Excel

**Menu :** Réception › Journaux › Import journalier. Cet écran permet de saisir toute une journée dans Excel (réceptions, contrôles qualité, paiements, ventes d'huile, dépenses) puis de l'importer en une fois.

![Assistant d'import journalier](images/02-reception/09-import.png)

### Étape 1 — Préparer le fichier

1. **Télécharger le modèle** : le fichier Excel propre à l'entreprise, dans la langue de l'interface. **Télécharger un exemple** fournit un fichier rempli pour la démonstration.
2. Remplir le modèle : une journée par fichier (feuille **Journée**). Les colonnes grises (références, lots prévus) se calculent seules ; les cellules rouges sont obligatoires ; les listes déroulantes proposent les valeurs autorisées.
3. Lire les **Règles obligatoires** et cocher **J'ai lu et j'accepte ces règles**.

Les règles à rappeler au client :

- utiliser uniquement le modèle de l'entreprise, sans renommer, supprimer ou déplacer de feuille ni de colonne ;
- une journée par fichier, dates au format AAAA-MM-JJ, nombres sans unité ;
- ne jamais saisir de numéro de lot ni copier des lignes d'un fichier à l'autre ;
- les cuves doivent déjà exister dans l'application ;
- les nouveaux éléments (fournisseurs, régions…) se déclarent dans leur feuille dédiée.

### Étape 2 — Charger et vérifier

Choisir le fichier `.xlsx` (20 Mo maximum) puis **Vérifier sans importer**. Rien n'est enregistré à cette étape.

### Étape 3 — Lire le rapport et importer

- La synthèse indique la date d'activité, le nombre de lignes valides et invalides, les entrées et sorties de stock et le total des dépenses.
- **Lignes validées** et **Lignes à corriger** détaillent chaque ligne : feuille, numéro, référence, lot prévu, statut (À créer, Enregistrement existant, Déjà importé, Erreur, Avertissement) et détails.
- Le rapport est téléchargeable en Excel ou CSV.
- **Importer les données validées** n'est actif que s'il n'y a aucune erreur et que le fichier est celui qui a été vérifié.

> **Attention :** une fois importées, les opérations sont réelles (stock, paiements, dépenses). Une erreur se corrige dans l'application, pas en réimportant un fichier modifié. Réimporter le même fichier ne crée pas de doublons : les lignes déjà importées sont ignorées.

> **Astuce :** si la connexion coupe pendant l'import, utiliser **Vérifier le résultat de l'import** avant de réessayer.

## 2.14 La fiche d'une réception

Un double-clic sur une réception, ou l'action **Afficher**, ouvre sa fiche : informations générales, poids et quantités, fournisseur, variété, huile, camion, cuve, trituration (moulin, date), prix (prix unitaire, total, payé, reste, état du paiement), résultats qualité et documents.

- Les **liens associés** ouvrent les transactions financières, les mouvements d'huile, la fiche et les paiements du fournisseur, la cuve et le contrôle qualité.
- Un bandeau permet d'ouvrir la réception d'olives ou d'huile liée.
- **QR** affiche le QR code de la réception ; **Générer Code QR** le régénère.

![Fiche d'une réception](images/02-reception/10-fiche-reception.png)

## 2.15 Le tableau de bord Réception

**Menu :** Accueil › Tableaux de bord, onglet **Réception**.

- Filtre par période et par **Type d'opération** (trituration particulier par défaut).
- Indicateurs : total des réceptions, réceptions terminées, volume, total payé et non payé.
- Graphiques : tendance des réceptions, et évolution du prix de base pour la trituration sur base.
- **Valeur du jour** : saisie du prix de référence du jour pour la base (TND/kg).

> **Remarque :** l'indicateur « Réceptions en attente » ne compte aujourd'hui que les lots **En cours** (annexe B).

## 2.16 Questions fréquentes

**Le numéro de lot a changé après l'enregistrement.**
Le numéro affiché dans le formulaire est une proposition. Le numéro définitif est attribué à l'enregistrement ; il peut différer si une autre réception a été enregistrée au même moment.

**La réception reste « En attente ».**
Le poids du camion vide n'a pas été saisi. Modifier la réception et renseigner ce poids.

**Je ne trouve pas mon achat d'olives sur le planning.**
Le prix n'a pas été défini. Utiliser **Définir le prix** sur la réception.

**Le bouton Enregistrer du contrôle qualité est grisé.**
Un paramètre est vide ou hors limites. Tous les paramètres doivent être renseignés et conformes.

**Le client veut payer la trituration en huile.**
Suivre le parcours « Trituration payée en huile » (2.9), pas l'option du panneau de paiement.

**Comment corriger une réception terminée ?**
Les réceptions terminées ne sont plus modifiables depuis la liste. Contacter l'administrateur ou le support : une suppression annule les paiements mais pas les mouvements de stock.

**Pourquoi « Accès refusé » en ouvrant Nouvelles réceptions ?**
La création exige le droit de création sur les réceptions. La liste des fournisseurs exige seulement le droit de lecture; le menu masque les entrées non autorisées.
