# Annexe A — Revue technique et fonctionnelle des layouts

Cette annexe s'adresse à l'équipe produit, au développement et au support. Elle décrit comment le cadre de l'application est construit et liste les écarts constatés lors de la revue du 28 septembre 2026. Les points L-01 et L-02 ont été corrigés; les autres corrections restent à valider.

Les chemins de fichiers sont relatifs à `F:/osm-ms-fe/src/app/`.

## A.1 Architecture du cadre

L'application n'a qu'un seul layout réellement utilisé : `AdminComponent` (`theme/layouts/admin/`). Il entoure toutes les pages après connexion. Les pages de connexion (`auth/**`) s'affichent sans layout, directement dans la sortie racine.

| Élément | Composant et fichier | Rôle |
|---|---|---|
| Cadre principal | `AdminComponent` — `theme/layouts/admin/admin.component.ts` | Tiroir latéral, barre du haut, menu horizontal, zone de page, pied de page, barre mobile |
| Barre du haut | `app-nav-bar` — `theme/layouts/toolbar/toolbar.component.ts` | Fond vidéo, partie gauche et partie droite |
| Partie gauche | `app-nav-left` — `toolbar/toolbar-left/` | Bouton d'ouverture du menu |
| Partie droite | `app-nav-right` — `toolbar/toolbar-right/` | Recherche, visite, aide, support, notifications, thème, profil |
| Menu vertical | `app-vertical-menu` + `menu-group`, `menu-collapse`, `menu-item` — `theme/layouts/menu/vertical-menu/` | Menu latéral |
| Menu horizontal | `app-horizontal-menu` — `theme/layouts/menu/horizontal-menu/` | Utilisé seulement si l'orientation horizontale est choisie |
| Navigation mobile | `app-mobile-bottom-nav`, `app-mobile-menu-sheet`, `app-mobile-module-menu` — `theme/layouts/mobile-bottom-nav/` | Barre du bas et feuilles de menu |
| Accès refusé | `app-access-denied` — `theme/layouts/access-denied/` | Page 403 dans le cadre |
| Fil d'Ariane | `app-breadcrumb` — `theme/components/breadcrumb/` | Titre de l'onglet du navigateur (le fil visible n'apparaît jamais, voir A.5) |
| Tableaux de bord | `DashboardHubComponent` — `dashboard-hub/` et `DashboardShellComponent` — `shared/components/dashboard/` | Onglets par module, en-tête, filtres, export |
| Visites guidées | `TourService`, `tour.registry.ts` — `shared/tour/` | Visites driver.js, 68 visites |

Au démarrage, `AdminComponent` :

1. charge et applique la configuration d'affichage (`ThemeConfigService`) ;
2. démarre les visites guidées ;
3. surveille le point de rupture mobile (1024,98 px) ;
4. charge le profil de l'entreprise (nom, logo, modules souscrits) ;
5. démarre les notifications (interrogation toutes les 90 s et notifications push) ;
6. construit le menu, puis le reconstruit quand les droits ou l'option de planification changent.

## A.2 Menus et règles d'affichage

- Menu des entreprises : `shared/oosm_menu.ts`. Menu de la plateforme : `shared/admin_menu.ts` (compte OosmAdmin).
- Filtrage : `shared/utils/menu-permission.filter.ts`, fonction `filterMenuByPermissions`.

Règles appliquées, dans l'ordre :

1. Les entrées exclues sont retirées (planification désactivée : `item-reception-mill-schedules`, `collapse-reception-planning`).
2. **Module :** le module de l'entrée vient de son `modulePermission`, sinon de son parent, sinon de son premier droit `MODULE:ENTITÉ:ACTION`. Le module doit figurer dans les modules souscrits. Si la liste des modules est vide, toutes les entrées rattachées à un module sont masquées. Une entrée dont le droit appartient à un autre module (par exemple un droit Inventaire sous Conditionnement) exige aussi cet autre module.
3. **Administrateur d'entreprise** (`isAdmin()`) : les droits ne sont pas vérifiés, mais les modules le sont.
4. **Droits :** `permissions[]` = au moins un des droits ; `modulePermission` + `ressourcePermission` = n'importe quelle action sur l'entité ; `modulePermission` seul = n'importe quel droit du module.
5. Les rubriques et groupes vides sont retirés.

Le menu OosmAdmin n'est pas filtré : ses entrées n'ont pas de module et le champ `role` n'est pas lu.

## A.3 Routes, layouts et gardes

Routage principal : `app-routing.module.ts`.

| Route | Layout | Garde(s) |
|---|---|---|
| `''` (parent) | `AdminComponent` | `AuthGuardChild` |
| `dashboard`, `dashboard/:tabId` | Cadre | Garde parent |
| `reception` | Cadre | `moduleGuard(RECEPTION)` + gardes de droits par page (`reception/reception.routes.ts`) |
| `storage`, `maintenance`, `mill-equipment`, `equipment-missions` | Cadre | `moduleGuard(PRODUCTION)` |
| `stock` | Cadre | `moduleGuard(INVENTAIR)` |
| `of`, `labels`, `projets`, `analytics` | Cadre | `moduleGuard(CONDITIONING)` |
| `finance` / `hr` | Cadre | `moduleGuard(FINANCE)` / `moduleGuard(HR)` |
| `settings` | Cadre | `moduleGuard(HABILITATION)` + `allPermissionGuard` sur utilisateurs et rôles |
| `administration` | Cadre | `AdminAuthGuard` sur chaque page, sinon `/access-denied` |
| `stock/par-emplacement` | Cadre | **Garde parent uniquement** (voir A.5) |
| `help`, `notifications`, `access-denied`, `account/profile` | Cadre | Garde parent |
| `auth/**` | Aucun | `AuthGuardLogin` |
| `**` | Aucun | Page d'erreur |

Comportement des gardes :

- `AuthGuardChild` (`interceptors/guards/auth.guard.ts`) : pas de jeton → déconnexion ; compte verrouillé → déconnexion avec message ; nouvel utilisateur → changement de mot de passe.
- `moduleGuard`, `allPermissionGuard`, `anyPermissionGuard` (`interceptors/guards/permission.guard.ts`) : attendent `ensureSessionContext()` pour connaître les modules avant de décider, puis redirigent vers `/access-denied` en cas de refus. L'administrateur d'entreprise passe les gardes de droits ; OosmAdmin passe les gardes de module.
- `AuthGuardLogin` : un utilisateur déjà connecté qui ouvre une page de connexion est redirigé vers ses tableaux de bord.

## A.4 Session, affichage et stockage navigateur

- **Session :** synchronisation toutes les 15 minutes et au retour sur l'onglet après 30 s d'absence (`POST /api/security/user/me/refresh-session`), avec un intervalle minimal de 2 minutes et une attente de 5 minutes après un échec. Le menu et les onglets des tableaux de bord se reconstruisent en direct. Aucune déconnexion pour inactivité.
- **Erreurs HTTP** (`interceptors/error.interceptor.ts`) : 401 → rafraîchissement du jeton puis nouvel essai, sinon déconnexion ; 400 `invalid_grant` → déconnexion ; 403 `access_denied` → déconnexion « compte verrouillé ».
- **Élément actif du menu :** `NavigationActiveService` retient l'adresse de menu la plus longue qui correspond au début de l'adresse courante.
- **Affichage :** `ThemeConfigService` applique des classes sur `body` (thème, contraste, couleur, orientation, RTL, verre, navigation mobile) et `html[dir]`.
- **Arabe :** `LanguageService` impose le sens droite-à-gauche ; l'orientation horizontale est alors ramenée à verticale.

| Clé | Stockage | Contenu |
|---|---|---|
| `themeConfig` | localStorage | Réglages d'affichage (JSON) |
| `app_language` | localStorage | `en`, `fr` ou `ar` |
| `oosm.tours.v1.<userId>` | localStorage | Visites déjà vues (`ID@version`) |
| `company_profile`, `company_profile_cached_at_<tenant>`, `company_profile_logo_<tenant>` | localStorage | Cache du profil d'entreprise (1 h) et logo |
| `auth_token`, `auth_refresh_token` | sessionStorage | Jetons sans « Se souvenir de moi » |
| `auth_token_remember`, `auth_refresh_token_remember`, `rememberMe`, `rememberMeExpiry`, `savedUsername` | localStorage | Jetons avec « Se souvenir de moi » (30 jours) |

## A.5 Constats

Gravité : **Élevée** = bloque ou trompe l'utilisateur ; **Moyenne** = incohérence visible ou risque ; **Faible** = finition ; **Info** = dette technique.

| N° | Gravité | Constat | Correction proposée |
|---|---|---|---|
| L-01 | Corrigé | Les entrées de création de réceptions exigent maintenant `RECEPTION:UNIFIEDDELIVERY:CREATE`; les routes `new` sont déclarées avant les routes `:id`; les listes et fiches fournisseurs exigent `SUPPLIER:READ`. | Validé par compilation Angular. |
| L-02 | Corrigé | `/settings/quality-control` est une route de premier niveau gardée par le module Production et par les permissions des critères. Le lien **Configuration générale** du profil exige désormais `HABILITATION:COMPANYPROFILE:READ`. | Validé par compilation Angular. |
| L-03 | Moyenne | `/stock/par-emplacement` n'est pas déclaré dans le module stock : il tombe sur la route de premier niveau (ligne 105), sans `moduleGuard(INVENTAIR)`. | Déplacer la route dans le module stock ou ajouter la garde. |
| L-04 | Moyenne | La rubrique **Pilotage › Analytics conditionnement** exige `CONDITIONING:ANALYTICS:READ` : un auditeur qui n'a que `CONDITIONING:AUDIT:READ` ne voit jamais **Journal d'audit**. L'onglet Analytique des tableaux de bord utilise READ, les pages du menu utilisent REPORT. | Sortir **Journal d'audit** de la rubrique, et harmoniser READ/REPORT. |
| L-05 | Moyenne | Les onglets de la barre mobile ne sont pas filtrés par module : si le groupe a été retiré du menu, l'appui sur l'onglet n'ouvre rien (`mobile-bottom-nav.component.ts`, lignes 59 à 76). | Construire les onglets à partir du menu filtré ; remplacer les onglets vides par les groupes disponibles. |
| L-06 | Moyenne | La case de connexion indique « Se souvenir de moi pendant 24 h » (`LOGIN.REMEMBERME`) alors que la session mémorisée dure 30 jours (`tokenService.service.ts`, ligne 25). | Choisir une durée et aligner le libellé en/fr/ar et le code. |
| L-07 | Moyenne | Sur mobile, le nom et le logo de l'entreprise ne sont affichés nulle part. Un utilisateur multi-entreprise ne sait pas dans quelle entreprise il travaille. | Afficher le logo ou le nom dans la barre du haut en mode mobile. |
| L-08 | Faible | Le fil d'Ariane du cadre n'apparaît jamais : toutes les entrées du menu ont `breadcrumbs: false`. Chaque page dessine son propre en-tête, de façon inégale. | Soit supprimer le fil d'Ariane du cadre, soit l'activer et retirer les en-têtes dupliqués des pages. |
| L-09 | Faible | Le réglage **droite-à-gauche** de **Autre Config** est écrasé par la langue (`theme-config.service.ts`, lignes 116 à 130). | Retirer ce réglage de l'écran ou le lier à la langue. |
| L-10 | Faible | Libellés : clé `RECEPTION.PLANNING.DISABLED_HINT` absente en en/fr/ar ; « Rapport mondial sur la FO » (au lieu de « Rapport global des OF ») ; « Quality control d'olive / d'huile » ; « Récapt saison » ; « arabe » sans majuscule. | Corriger les fichiers `src/assets/i18n/*.json`. |
| L-11 | Faible | Textes codés en dur : message `alert()` en français dans la recherche globale, infobulle anglaise « Logout and Login with Admin… », titre d'onglet « Welcome ». | Passer par les traductions ; remplacer `alert()` par une notification de l'application. |
| L-12 | Faible | Accessibilité : le bouton du profil a pour libellé accessible `AUTO.MODE` (« mode »). | Libellé « Menu du compte ». |
| L-13 | Faible | La garde `AuthGuardChild` ne s'exécute qu'à l'entrée dans le cadre ; les contrôles « compte verrouillé » et « nouvel utilisateur » ne sont pas refaits à chaque navigation (le serveur reste la vraie protection). | Ajouter `canActivateChild` ou refaire le contrôle lors de la synchronisation de session. |
| L-14 | Info | Code mort hérité du modèle Able Pro : `EmptyComponent`, `ComponentComponent` et son routage, `theme/components/navigation/*`, les deux `ConfigurationComponent` (même sélecteur), `theme/pages/dashboard/*`, les démos apex-chart (sauf `EarningChartComponent`), la plupart de `theme/pages/maintenance/*`, `shared/services/auth.service.ts` (clé `jwt_token`, encore utilisée par « mot de passe oublié »), `AdminComponent.onApply`, `data.roles` sur les routes et `roleGuard` jamais lus. | Supprimer par lots, en migrant d'abord « mot de passe oublié » vers le service d'authentification principal. |
| L-15 | Info | Points à tester : `manageLayout` lit `window.innerWidth` une seule fois et écrit des marges en ligne sur `.mat-drawer-content` ; le tiroir reste `opened` en mode `over` sur tablette sans barre mobile ; `AuthGuardLogin` sur la page de changement de mot de passe peut renvoyer un nouvel utilisateur vers la même adresse. | Vérifier en recette sur tablette et avec un compte neuf. |

## A.6 Recommandations pour la formation

- L-01 et L-02 sont corrigés. Préparer les rôles de démonstration avec les permissions réellement nécessaires; le menu ne doit plus afficher de lien bloqué par sa garde.
- Tant que L-06 n'est pas corrigé, annoncer « plusieurs jours » pour **Se souvenir de moi**, pas « 24 h ».
- Préparer une entreprise de démonstration avec tous les modules souscrits et trois rôles types : administrateur, opérateur de réception, comptable.
