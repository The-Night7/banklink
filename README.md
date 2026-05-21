Construit une application complète de budget qui fonctionne sur application mobile et en web avec une base de données en ligne (firebase) de sorte à ce qu'il connecte à la banque avec l'historique et tout et à ce qu'il montre les recettes, les dépenses, les objectifs, à ce qu'elle classifie les dépenses dans des catégories différentes et accurate, dans laquelle on peut définir des objectifs de saving des budgets etc, l'évolution de tout depuis le début grace à l'historique récupéré les affichages des données sont sous forme de graphes style histo, courbes, demi-camemberts...
const firebaseConfig = {
  apiKey: "AIzaSyAhdwrCfYyYNhJIwEpxOqoeQeTm0I5k_pc",
  authDomain: "bankllink.firebaseapp.com",
  projectId: "bankllink",
  storageBucket: "bankllink.firebasestorage.app",
  messagingSenderId: "915210189378",
  appId: "1:915210189378:web:960bcafa5aada3ebdf8bdb",
  measurementId: "G-PVM4YSYGBS"
};

# BudgetLink V1: application budget web + mobile sur Expo, Firebase et Powens

## Résumé
- Construire un projet greenfield avec un client unique `Expo + React Native Web` pour iOS, Android et web.
- Utiliser `Firebase Auth`, `Firestore`, `Cloud Functions v2`, `Storage`, `Hosting`, `App Check` et `Secret Manager`.
- Retenir `Powens Transactions` comme provider bancaire principal pour la V1 France/UE, avec une couche d’abstraction `BankProvider` pour pouvoir ajouter `Bridge` plus tard sans refonte du domaine.
- Livrer une V1 personnelle, en français, en lecture seule, avec connexion bancaire, historique, catégorisation auto corrigible, budgets, objectifs d’épargne, dashboard et graphiques.
- Prévoir un fallback `import CSV` pour les banques non supportées ou les connexions en échec.

## Portée produit
- Authentification: email/mot de passe + Google via Firebase Auth.
- Usage: un seul utilisateur propriétaire de ses comptes et de ses données.
- Connexion bancaire: consentement PSD2 via Powens, récupération des comptes, soldes et transactions.
- Historique: importer le maximum disponible au premier sync, puis conserver tout l’historique importé dans Firestore de manière cumulative.
- Transactions: liste filtrable, recherche, détail, recatégorisation, marquage récurrent, exclusion optionnelle des transferts internes des analyses.
- Budgets: budgets mensuels par catégorie, suivi consommé/restant, alertes visuelles.
- Objectifs: objectifs d’épargne avec montant cible, échéance, progression, projection simple.
- Dashboard: revenus, dépenses, cashflow net, progression budgets, progression objectifs, soldes agrégés.
- Graphiques: histogramme mensuel dépenses par catégorie, courbe cashflow net, demi-camembert répartition des dépenses, courbe d’évolution épargne.
- Import secours: upload CSV, mapping des colonnes, déduplication, intégration dans les mêmes vues que les données bancaires.

## Architecture retenue
- Monorepo `npm workspaces` avec:
- `apps/client`: app Expo Router web/mobile.
- `apps/functions`: Firebase Functions TypeScript.
- `packages/domain`: types métier, taxonomie catégories, règles de calcul.
- `packages/ui`: primitives UI partagées, thème, composants graphiques.
- `packages/config`: configuration partagée, schémas `zod`, constantes.
- Frontend:
- `Expo Router`, `React Query`, `React Hook Form`, `Zod`, `NativeWind`, `react-native-svg` + `d3-shape/d3-scale` pour des graphes custom cross-platform.
- Backend:
- Firebase Functions HTTP/callable pour les opérations sensibles.
- Firestore pour le stockage applicatif et les vues agrégées.
- Scheduled functions pour resync quotidien, recalculs et rappels de reconsentement.
- Sécurité:
- Secrets Powens uniquement côté serveur.
- Aucune crédential bancaire stockée côté client.
- Firestore Rules par `uid`.
- `App Check` activé pour le client.
- Logs structurés + alertes backend, `Sentry` côté client.

## Intégration bancaire
- Provider V1: `Powens`.
- Flux:
- le client demande une session de connexion bancaire à une Cloud Function;
- la fonction crée la session Powens et retourne l’URL/token de connexion;
- le client ouvre le widget/flux hébergé;
- Powens notifie le backend par webhook;
- le backend récupère comptes et transactions, normalise, déduplique, catégorise, puis stocke.
- Sync:
- sync automatique quotidien;
- bouton de sync manuel côté utilisateur;
- gestion du renouvellement de consentement avant expiration.
- Résilience:
- file d’état sur `bankConnections.status`;
- retry exponentiel sur fetch provider;
- bannière UI si consentement expiré ou sync partielle.

## Modèle de données
- `/users/{uid}`: profil, devise, locale, préférences.
- `/users/{uid}/bankConnections/{connectionId}`: provider, institution, statut, dernier sync, consent expiry.
- `/users/{uid}/accounts/{accountId}`: type, libellé, iban masqué, devise, solde courant, solde disponible.
- `/users/{uid}/transactions/{transactionId}`: source, accountId, date, montant signé, libellé brut, libellé normalisé, merchant, catégorie provider, catégorie interne, score de confiance, hash de déduplication, flags.
- `/users/{uid}/merchantRules/{ruleId}`: pattern, catégorie imposée, priorité, origine manuelle.
- `/users/{uid}/budgets/{budgetId}`: mois, catégorie, plafond, consommé, seuils.
- `/users/{uid}/goals/{goalId}`: nom, cible, date cible, comptes inclus, progression.
- `/users/{uid}/monthlySummaries/{yyyy-mm}`: revenus, dépenses, épargne nette, breakdown par catégorie.
- `/users/{uid}/imports/{importId}`: fichier, mapping, statut, erreurs, compte cible.

## Règles métier
- Taxonomie V1 fixe: logement, alimentation, transport, santé, loisirs, abonnements, shopping, impôts/frais, revenus, épargne, transferts, autres.
- Pipeline de catégorisation:
- mapping catégorie provider vers taxonomie interne;
- normalisation commerçant/libellé;
- application des règles utilisateur;
- fallback mots-clés;
- mise en revue si confiance basse.
- Quand l’utilisateur recatégorise une transaction, créer ou proposer une règle marchand réutilisable.
- Les agrégats mensuels sont matérialisés serveur pour garder des dashboards rapides sur long historique.
- Les transferts internes détectés sont exclus des graphiques dépenses/revenus par défaut, mais visibles dans l’historique complet.

## Interfaces publiques et APIs à créer
- Callable `createBankLinkSession(provider: "powens") -> { sessionUrl, expiresAt }`
- Callable `runManualSync(connectionId?) -> { accepted: true }`
- Callable `disconnectBankConnection(connectionId) -> { success: true }`
- Callable `createCsvImportUpload() -> { uploadUrl, importId }`
- Callable `confirmCsvImport(importId, mapping, accountMeta) -> { accepted: true }`
- HTTP `POST /webhooks/powens` pour événements provider.
- Types partagés `UserProfile`, `BankConnection`, `Account`, `Transaction`, `Budget`, `SavingsGoal`, `MonthlySummary`, `CsvImport`, `CategoryId`.

## Parcours UI
- Onglets: `Accueil`, `Transactions`, `Budgets`, `Objectifs`, `Comptes`, `Réglages`.
- Écran onboarding: auth, préférence devise, ajout première banque ou import CSV.
- Accueil: KPI, courbe cashflow, demi-camembert dépenses, budgets en alerte, objectifs proches.
- Transactions: filtres date/catégorie/compte, recherche, détail, changement catégorie.
- Budgets: vue mensuelle par catégorie, progression et écarts.
- Objectifs: cartes d’objectifs, progression, estimation à date cible.
- Comptes: liste des comptes connectés, soldes, statut sync, reconnect.
- Réglages: profil, méthodes de connexion, exports futurs hors V1, déconnexion.

## Séquence d’implémentation
1. Initialiser le monorepo, Expo app, Firebase Functions, packages partagés, CI et emulator suite.
2. Mettre en place Firebase Auth, Firestore Rules, App Check, schémas `zod`, types domaine.
3. Construire le shell UI, navigation, thème, onboarding et auth screens.
4. Intégrer Powens côté serveur puis le flux de connexion côté client.
5. Implémenter ingestion, normalisation, déduplication, catégorisation et agrégats mensuels.
6. Construire écrans comptes, transactions, dashboard et composants graphiques.
7. Ajouter budgets et objectifs avec recalcul temps réel basé sur les agrégats.
8. Ajouter import CSV générique et fusion avec les données synchronisées.
9. Finaliser observabilité, consent renewal, erreurs, empty states, QA et déploiement.

## Tests et scénarios d’acceptation
- Unitaires:
- normalisation libellé marchand;
- mapping catégories provider -> internes;
- déduplication transaction;
- calculs budget, cashflow, progression objectif.
- Intégration:
- webhook Powens valide puis ingestion Firestore;
- sync partiel avec retry;
- reconsentement d’une connexion expirée;
- import CSV avec mapping correct et rejet des doublons.
- E2E web `Playwright`:
- inscription, connexion banque mockée, visualisation dashboard, recatégorisation, création budget, création objectif.
- E2E mobile `Maestro`:
- login Google/email, ouverture flux connexion, navigation onglets, sync manuel, fallback CSV.
- Acceptation produit:
- un utilisateur peut connecter au moins une banque FR/UE, voir ses comptes et transactions;
- les revenus/dépenses sont visibles par période et catégorie;
- une recatégorisation modifie les vues futures cohérentes;
- un budget et un objectif reflètent correctement les transactions synchronisées;
- le web et le mobile affichent les mêmes données et mêmes règles métier.

## Hypothèses et choix par défaut
- V1 en lecture seule: pas d’initiation de paiement ni de conseils financiers réglementés.
- Provider principal: Powens, car le besoin prioritaire est la couverture France/UE; l’adaptateur `BankProvider` garde Bridge possible en V2.
- Langue unique en V1: français.
- Usage unique personnel en V1: pas d’espace foyer ni de collaboration.
- Historique initial dépend du provider; l’application conserve ensuite l’historique importé indéfiniment.
- Sync automatique quotidienne + sync manuel utilisateur.
- CSV fallback générique, pas de connecteurs CSV spécifiques par banque en V1.
- Déploiement web sur Firebase Hosting; builds mobiles via Expo/EAS.

## Sources utilisées pour le choix provider
- Powens Transactions: https://www.powens.com/fr/produits/transactions/
- Powens plateforme: https://www.powens.com/fr/
- Bridge docs: https://docs.bridgeapi.io/docs/quickstart
- Bridge présentation: https://www.bridgeapi.io/
