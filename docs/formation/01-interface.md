# Chapitre 1 — Prise en main de l'interface

**Objectif :** à la fin de ce chapitre, l'utilisateur sait se connecter, se repérer dans l'écran, trouver un menu, comprendre pourquoi un menu est absent, utiliser la barre du haut, les tableaux de bord et les visites guidées, travailler sur mobile, changer de langue et personnaliser l'affichage.

**Durée conseillée en formation :** 45 minutes.

## 1.1 Connexion et session

### Se connecter

1. Ouvrir l'adresse de l'application communiquée par ZitFlow (par exemple `https://zitflow.x-dev.pro`).
2. Choisir la langue en haut de la page si besoin (français, anglais ou arabe).
3. Saisir l'**Identifiant, e-mail ou téléphone**, puis le **mot de passe**. L'icône en forme d'œil affiche le mot de passe saisi.
4. Cocher **Se souvenir de moi** pour rester connecté sur cet appareil.
5. Cliquer sur **Connexion**. Le bouton est désactivé pendant la vérification pour éviter les doubles clics.

![Écran de connexion](images/01-interface/01-connexion.png)

Après la connexion, l'utilisateur arrive sur les **Tableaux de bord** de son entreprise.

### Premier accès et mot de passe temporaire

Lorsqu'un administrateur crée un compte, l'utilisateur reçoit un mot de passe temporaire. À la première connexion, l'application ouvre directement l'écran de changement de mot de passe. L'utilisateur ne peut pas accéder au reste de l'application tant que le mot de passe n'a pas été changé.

### Mot de passe oublié

Le lien **Mot de passe oublié ?** sous le formulaire permet de recevoir un code de réinitialisation. L'utilisateur saisit ensuite le code et son nouveau mot de passe.

### Durée de session

- Sans **Se souvenir de moi**, la session se termine à la fermeture de l'onglet du navigateur.
- Avec **Se souvenir de moi**, l'appareil reste connecté plusieurs jours.
- Pendant l'utilisation, l'application met à jour la session en arrière-plan toutes les 15 minutes, et à chaque retour sur l'onglet. Les droits de l'utilisateur et les modules de l'entreprise sont alors rechargés : si un administrateur ajoute un droit, le menu se met à jour sans se reconnecter.
- Il n'y a pas de déconnexion automatique pour inactivité.

> **Attention :** sur un ordinateur partagé, ne pas cocher **Se souvenir de moi** et toujours utiliser **Déconnexion**.

### Compte bloqué

Si un administrateur bloque un compte, l'utilisateur est déconnecté et un message l'informe que son compte est verrouillé. Seul un administrateur de l'entreprise peut le débloquer (**Paramètres système › Sécurité & accès › Gestion des utilisateurs**).

## 1.2 Vue d'ensemble de l'écran

Toutes les pages de l'application partagent la même structure.

![Structure de l'écran : menu latéral, barre du haut, zone de travail](images/01-interface/02-vue-ensemble.png)

| Zone | Emplacement | Contenu |
|---|---|---|
| Menu latéral | À gauche (à droite en arabe) | Logo et nom de l'entreprise, numéro de version, menu des modules |
| Barre du haut | En haut | Recherche globale, visite guidée, aide, support, notifications, thème, profil |
| Zone de travail | Au centre | La page ouverte : tableau de bord, liste, formulaire |
| Pied de page | En bas | Logo et mentions |

Un clic sur le logo ou le nom de l'entreprise en haut du menu ramène aux **Tableaux de bord**.

> **Astuce :** le numéro de version (par exemple `v1.4.2`) sous le nom de l'entreprise est à communiquer au support lors d'un signalement.

## 1.3 Le menu latéral

### Fonctionnement

- Le menu est organisé en **groupes** (Réception, Unité de Production, Finance & Comptabilité…).
- Chaque groupe contient des **rubriques dépliables** (flèche à droite) et des **pages**.
- La page ouverte est surlignée, et sa rubrique reste dépliée.
- Sur un ordinateur, le bouton en haut à gauche de la barre du haut réduit ou affiche le menu.

![Menu latéral déplié sur Nouvelles réceptions](images/01-interface/03-menu.png)

### Arborescence complète

Le tableau ci-dessous présente le menu complet. Un utilisateur ne voit que les parties autorisées pour lui (voir 1.4).

| Groupe | Rubrique | Pages |
|---|---|---|
| Accueil | — | Tableaux de bord |
| Réception | Nouvelles réceptions › Réception d'olives | Trituration particulier, Trituration sur base, Achat d'olives, Échange |
| Réception | Nouvelles réceptions | Réception d'huile |
| Réception | Journaux | Journal réception olives, Journal réception huile, Journal achat, Import journalier |
| Réception | Planification | Plannings Trituration (si la planification est activée) |
| Réception | Fournisseurs & apporteurs | Fournisseurs & apporteurs |
| Unité de Production | Contrôle qualité | Contrôle qualité d'olive, Contrôle qualité d'huile |
| Unité de Production | Stockage & flux huile | Unités de stockage d'huile, Transactions huile, Filtrage Huile, Contenants huile |
| Conditionnement & Logistique | Atelier de conditionnement | Ordres de fabrication (OF), Lignes de conditionnement, Gestion des Étiquettes, Certifications |
| Conditionnement & Logistique | Catalogue | Articles de cond., Produits finis, Nomenclatures (BOM) |
| Conditionnement & Logistique | Projets & expéditions | Projets de production, Expéditions & BL, Clients |
| Stocks & Inventaire | Opérations Stock | Mouvements Stock, Emplacements, Stock par Zone |
| Stocks & Inventaire | Achats & Fournisseurs | Bons de Commande, Fournisseurs matériel |
| Finance & Comptabilité | Trésorerie & banques | Caisse du jour, Gestion des Comptes Bancaires, Transactions Financières, Dépenses |
| Finance & Comptabilité | Ventes & crédits | Ventes d'Huile, Crédit d'Huile, Gestion des déchets |
| Finance & Comptabilité | — | Récap saison |
| Ressources Humaines | — | Tableau de bord RH |
| Ressources Humaines | Organisation | Annuaire & fiches, Départements, Grades, Intitulés & rôles, Contrats de travail, Documents employés |
| Ressources Humaines | Temps & présence | Présence quotidienne, Horaires de travail, Feuilles de temps, Heures supplémentaires, Absences & validations |
| Ressources Humaines | Paie | Bulletins & CNSS, Bulletins de paie, Avances sur salaire, Prêts employés, Variables de paie |
| Ressources Humaines | Paramètres RH | Types de congé, Jours fériés, Paramètres RH, Conformité, Agent RH |
| Maintenance & équipements | — | Maintenance, Équipements mobiles, Missions externes |
| Pilotage | Analytics conditionnement | Rapport global des OF, Rendements des OF, Qualité & Non-conformités, Écarts Nomenclatures (BOM), Efficacité Filtrage, Journal d'audit |
| Paramètres système | Entreprise & application | Configuration générale |
| Paramètres système | Qualité & équipements | Critères de contrôle qualité, Machines de trituration |
| Paramètres système | Sécurité & accès | Gestion des utilisateurs, Gestion des rôles |

> **Remarque pour le formateur :** quelques libellés affichés aujourd'hui diffèrent légèrement de ce tableau (« Quality control d'olive », « Rapport mondial sur la FO », « Récapt saison »). Leur correction est prévue (voir l'annexe A).

## 1.4 Pourquoi je ne vois pas un menu ?

C'est la question la plus fréquente en formation. Un menu s'affiche uniquement si **trois conditions** sont réunies.

1. **Le module est activé pour l'entreprise.** Chaque entreprise souscrit à des modules : Réception, Production, Conditionnement, Inventaire, Finance, Ressources humaines, Habilitation. Un module non souscrit disparaît entièrement du menu, pour tous les utilisateurs, y compris l'administrateur de l'entreprise.
2. **Le rôle de l'utilisateur donne le droit correspondant.** Les droits se règlent dans **Paramètres système › Sécurité & accès › Gestion des rôles**. Par exemple, un droit de lecture sur les ordres de fabrication fait apparaître **Ordres de fabrication (OF)**.
3. **L'option concernée est active.** Par exemple, **Planification** n'apparaît que si la planification de trituration est activée dans la configuration de l'entreprise.

Le rôle **Administrateur** de l'entreprise voit toutes les pages des modules souscrits, sans avoir besoin de droits détaillés.

Une rubrique dont toutes les pages sont masquées disparaît aussi. Un groupe vide disparaît également.

### La page « Accès refusé »

Si un utilisateur ouvre une adresse à laquelle il n'a pas droit (lien reçu par un collègue, favori ancien), il arrive sur la page **Accès refusé**. Deux boutons sont proposés : **Retour à l'accueil** et **Se déconnecter**.

![Page Accès refusé](images/01-interface/04-acces-refuse.png)

> **Remarque :** le menu masque les entrées de saisie si le rôle ne possède pas le droit de création requis. Un utilisateur avec lecture seule peut consulter les listes autorisées, sans voir un lien de création qui mènerait à **Accès refusé**.

## 1.5 La barre du haut

![Barre du haut](images/01-interface/05-barre-haut.png)

De gauche à droite :

| Élément | Icône | Rôle |
|---|---|---|
| Recherche globale | Loupe | Saisir un code (lot, OF, projet, réception) puis Entrée : l'application ouvre directement la fiche correspondante |
| Visite guidée de cette page | Panneau indicateur | Relance la visite guidée de la page ouverte |
| Aide | Point d'interrogation | Ouvre la page d'aide |
| Support | Casque | Ouvre le formulaire **Ouvrir un ticket support** |
| Notifications | Cloche | Pastille avec le nombre de notifications non lues ; **Tout voir** et **Tout marquer comme lu** |
| Thème | Soleil / lune | **Clair**, **Sombre** ou **Auto** (suit le réglage de l'ordinateur ou du téléphone) |
| Profil | Avatar | Menu du compte (voir ci-dessous) |

### Recherche globale

1. Cliquer dans la zone **Recherche globale**.
2. Saisir ou scanner le code complet, par exemple un numéro de lot `0001OC26`.
3. Appuyer sur Entrée ou cliquer sur la loupe.

Si le code est trouvé, la fiche s'ouvre. Sinon un message indique qu'aucun résultat n'a été trouvé.

> **Astuce :** la recherche fonctionne avec une douchette : le scan envoie le code suivi d'Entrée.

### Notifications

La cloche affiche le nombre de notifications non lues (au-delà de 99, « 99+ »). La liste se met à jour automatiquement toutes les 90 secondes. Si le client a autorisé les notifications du navigateur, elles apparaissent aussi hors de l'application.

### Menu du profil

![Menu du profil](images/01-interface/06-menu-profil.png)

- **En-tête** (photo, nom, e-mail) : ouvre **Mon compte** (informations personnelles, photo, mot de passe).
- **Gérer** :
  - **Mon compte** ;
  - **Notifications** ;
  - **Ouvrir un ticket support** ;
  - **Configuration générale** (réservé aux utilisateurs qui ont accès aux paramètres) ;
  - **Revoir toutes les visites guidées**.
- **Langue** : anglais, français, arabe.
- **Déconnexion**.

## 1.6 Les tableaux de bord

La page d'accueil **Tableaux de bord** regroupe les indicateurs de chaque module dans des onglets.

![Tableaux de bord avec onglets et filtres](images/01-interface/07-tableaux-de-bord.png)

- **Onglets :** Vue d'ensemble, Réception, Finance, Stockage, Inventaire, Ressources humaines, Analytique. Un onglet n'apparaît que si le module est souscrit et que l'utilisateur a le droit de lecture correspondant.
- **Fil d'Ariane :** en haut à gauche, par exemple « Tableaux de bord › Réception ».
- **Outils à droite :** filtre de dates, export, actualisation. Ils s'appliquent à l'onglet ouvert.
- L'adresse de la page suit l'onglet (`/dashboard/reception`…) : un favori ouvre directement le bon onglet.

Si aucun onglet n'est autorisé, la page affiche « Aucun tableau de bord disponible ». Il faut alors vérifier les modules et les droits (voir 1.4).

## 1.7 Les visites guidées

Chaque page importante possède une visite guidée : une série de bulles qui présentent les zones de l'écran.

- La visite démarre **automatiquement la première fois** qu'un utilisateur ouvre la page.
- Elle ne redémarre plus ensuite. Le suivi est propre à chaque utilisateur et à chaque navigateur.
- Le bouton **Visite guidée de cette page** de la barre du haut la relance à tout moment.
- **Profil › Revoir toutes les visites guidées** réactive toutes les visites, comme pour un nouvel utilisateur.

![Visite guidée en cours](images/01-interface/08-visite-guidee.png)

> **Astuce :** en formation, demander aux participants de suivre la visite de chaque page à la première ouverture. Pour une démonstration, utiliser **Revoir toutes les visites guidées** avant la séance.

## 1.8 Utilisation sur mobile et tablette

Sur un téléphone ou une tablette (écran de moins de 1025 pixels de large), le menu latéral est remplacé par une **barre de navigation en bas de l'écran**.

![Navigation mobile en bas et feuille de menu](images/01-interface/09-mobile.png)

| Onglet | Contenu |
|---|---|
| Accueil | Tableaux de bord |
| Réception | Les pages du groupe Réception |
| Unité de Production | Contrôle qualité et stockage |
| Conditionnement & Logistique | Atelier, catalogue, projets et expéditions |
| Plus | Tous les autres groupes : Stocks, Finance, RH, Maintenance, Pilotage, Paramètres |

Un appui sur un onglet de module ouvre une **feuille** qui monte du bas de l'écran avec les pages du groupe. Elle se ferme dès qu'une page est choisie.

### Installer l'application

ZitFlow peut être installée comme une application sur le téléphone ou l'ordinateur : **Paramètres système › Configuration générale › Autre Config › Installer l'application**. Elle s'ouvre alors en plein écran depuis une icône.

> **Remarque :** sur mobile, le nom de l'entreprise n'est pas affiché. Si la barre du bas ne convient pas à un client, elle peut être désactivée (option **Navigation mobile en bas**, voir 1.10) : le menu latéral réapparaît sous forme de volet.

## 1.9 Langues et affichage en arabe

- La langue se change dans **Profil › Langue** : anglais, français ou arabe. Sur l'écran de connexion, le choix se fait en haut de la page.
- Le choix est mémorisé sur l'appareil. Sans choix, l'application utilise la langue par défaut de l'entreprise, puis celle du navigateur.
- En **arabe**, tout l'écran passe de droite à gauche : le menu latéral passe à droite, les icônes et les listes s'inversent, et les visites guidées suivent le même sens.

![Interface en arabe, de droite à gauche](images/01-interface/10-arabe.png)

## 1.10 Personnaliser l'affichage

Les réglages d'affichage se trouvent dans **Paramètres système › Configuration générale**, onglet **Autre Config**.

![Onglet Autre Config](images/01-interface/11-autre-config.png)

| Réglage | Effet |
|---|---|
| Mode du thème | Clair, Sombre ou Auto |
| Effet verre (Liquid Glass) | Effet de transparence sur les cartes et menus |
| Navigation mobile en bas | Active ou désactive la barre du bas sur mobile |
| Cartes tableau de bord mobile | Présentation en cartes des tableaux de bord sur mobile |
| Contraste | Fond clair ou gris |
| Légendes du menu | Affiche ou masque les titres de groupes dans le menu |
| Couleur | Couleur principale de l'interface (bleu, indigo, violet, rose, rouge, orange, jaune, vert, turquoise) |
| Orientation du menu | Vertical (par défaut), horizontal (menu en haut) ou compact (icônes seules, le menu s'élargit au survol) |
| Largeur | Pleine largeur ou centrée (boxed) |
| Installer l'application | Installe ZitFlow comme une application |

Les changements s'affichent immédiatement en aperçu. Le bouton **Appliquer** les enregistre. La couleur choisie devient aussi la couleur de l'entreprise.

> **Attention :** les réglages d'affichage (sauf la couleur de l'entreprise) sont enregistrés sur l'appareil. Un utilisateur qui change d'ordinateur retrouve l'affichage par défaut.

## 1.11 Compte administrateur de la plateforme

Ce paragraphe concerne l'équipe ZitFlow, pas les clients.

Le compte administrateur de la plateforme (OosmAdmin) a un menu différent :

- **Tableaux de bord › Admin plateforme** : vue d'ensemble des entreprises clientes, utilisateurs, activité, modules souscrits, tickets et inscriptions récentes ;
- **Administration** : Profils de société, Gestion des utilisateurs, Tickets support, Catalogue de permissions, Paramètres, Documentation API, Ajouter admin ZitFlow.

La recherche globale est masquée pour ce compte. L'icône de support ouvre directement la liste des tickets.

## 1.12 Questions fréquentes

**Un collègue voit un menu que je ne vois pas.**
Vos rôles sont différents. Demander à l'administrateur de comparer les deux rôles dans **Gestion des rôles**.

**Je vois le menu mais j'obtiens « Accès refusé ».**
La page demande un droit plus fort que la lecture (souvent le droit de création). L'administrateur doit l'ajouter au rôle.

**Un module entier a disparu pour tout le monde.**
Le module n'est plus activé pour l'entreprise. Contacter ZitFlow.

**Mon administrateur m'a donné un droit mais le menu n'a pas changé.**
Le menu se met à jour automatiquement dans les 15 minutes, ou en revenant sur l'onglet après une absence. Pour un effet immédiat : se déconnecter puis se reconnecter.

**La visite guidée ne s'affiche plus.**
Elle ne s'affiche qu'une fois. Utiliser le bouton **Visite guidée de cette page** ou **Revoir toutes les visites guidées**.

**L'écran est passé de droite à gauche.**
La langue arabe est sélectionnée. Changer la langue dans **Profil › Langue**.

**Sur téléphone, je ne trouve pas le menu.**
Utiliser la barre en bas de l'écran ; les groupes absents des onglets sont dans **Plus**.

**Que donner au support en cas de problème ?**
Le numéro de version sous le nom de l'entreprise, la page concernée, l'heure et une capture d'écran. Le plus simple est d'utiliser **Ouvrir un ticket support**.
