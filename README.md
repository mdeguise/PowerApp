# Gestion du cycle d'emploi - Tremblant

A working prototype (React + TypeScript, built with Vite) of a full employee lifecycle request tool: **Nouvelle intégration**, **Réactivation**, and **Avis de terminaison ou mise à pied temporaire** (offboarding), each as its own multi-step wizard sharing the same app shell.

## Current state — decision made

This was originally built as a Power Apps **Code App**. That plan changed: Code Apps require a **Power Apps Premium** license for every end user, regardless of which connectors they use — and this app's users mostly hold **Microsoft 365 F3** licenses, which don't include Premium. Licensing that many F3 users would cost more than it's worth.

The next candidate was a Power App inside Microsoft Teams, backed by Dataverse for Teams — also free under F3, with a nicer data model. That didn't pan out either: it requires Teams Administrator access to unblock the Power Apps app in the Teams Admin Center, and that access wasn't available.

A SharePoint Framework (SPFx) web part was also considered — it would have kept this exact React/TypeScript codebase, hosted inside a SharePoint page — but that path is also closed off.

**Decision: a classic Canvas App in Power Apps Studio, backed by SharePoint.** This needs no special admin unblock — Canvas Apps using only standard connectors (SharePoint, which is all this app needs) run under F3's included "Power Apps for Microsoft 365" entitlement automatically. All you need is a SharePoint site, which most users can already create or already have access to.

The tradeoff, worth remembering going in: none of this prototype's code carries over (the `.pa.yaml` source format is read-only/review-only in Studio, so Canvas Apps can't be authored as code). Canvas Apps are built screen-by-screen in Power Apps Studio with Power Fx formulas, not React — this repo now serves purely as the **design and logic reference** (exact copy, fields, validation rules, conditional behavior) for that rebuild, not as code to port.

This project itself keeps running standalone with local mock data (`src/data/catalogs.ts`) — useful as a live reference/spec while rebuilding, and to keep iterating on logic quickly before porting a change over to Studio.

```
npm install
npm run dev
```

## Project structure

- `src/types.ts` — the full data model (`OnboardingRequest`), covering both the onboarding/reactivation flow and the offboarding flow
- `src/context/WizardContext.tsx` — wizard state, navigation, validation; step list and step count are **dynamic**, switching between the 6-step onboarding flow and the 4-step offboarding flow based on `typeDemande`
- `src/data/catalogs.ts` — all lookup/reference data (employee directory, departments, pay rules, access systems, equipment, applications, offboarding reasons) — **this is what becomes real SharePoint list data**
- `src/components/` — shared UI (Header, StepNav, SummarySidebar, TipBanner, SubmissionModal, form primitives)
- `src/steps/` — one component per wizard step, for both flows:
  - Onboarding: `Step1Employee`, `Step2Position`, `Step3Access`, `Step4Equipment`, `Step5Applications`, `Step6Review`
  - Offboarding: `Step1Employee` (shared, branches its UI), `Step2Cessation`, `Step3DepartmentComments`, `StepReviewOffboarding`

## Rebuilding as a Canvas App (SharePoint)

### 1. SharePoint site

Using the existing site: **https://alterramtnco.sharepoint.com/sites/POWERAPPFORMS/**

This site already has real infrastructure on it — worth knowing before touching anything:

| Existing list | Items | What it is |
|---|---|---|
| `EMPLOYE_LIST` | 1,955 | Live, Workday-synced employee roster — over 100 columns, already includes exactly the fields this app's design assumes (active/terminated status, manager, position, department, hire/termination dates, etc.) |
| `LIST_FORMS` | 2 | Minimal list (`NAME`/`DEPARTEMENT` columns: "ONBOARDING"/RH, "OFFBOARDING"/RH). Not used by this design — confirmed OK to ignore or repurpose later. |

**Decision: the app reads employee data directly from `EMPLOYE_LIST`, read-only — no separate "Répertoire des employés" list is created.** No duplicated data, and it stays current with whatever already keeps `EMPLOYE_LIST` in sync with Workday.

#### Field mapping — our app's fields → real `EMPLOYE_LIST` columns

Confirmed by sampling real rows in the list (not just the column list) — should still get a final one-click check per field when building in Studio, but these are well-evidenced, not guesses:

| App field | `EMPLOYE_LIST` column | Notes |
|---|---|---|
| NumeroEmploye | `Title` | holds the employee ID (e.g. `122962`, `200006`) |
| Prenom | `First_Name` (`Preferred_First_Name` when populated) | most sampled rows have `Preferred_First_Name` blank |
| Nom | `Last_Name` | |
| Poste | `Position_Title` | already **French** job titles in real data (e.g. "Chef régional des opérations", "Opérateur damage", "Moniteur IV") — better fit than `Business_Title`, which looked English-oriented |
| Departement | `Job_Family_Group` | real values ("Mountain Operations", "Ski & Ride School", "Activities", "Information Technology", "Food & Beverage", "Hospitality", "Retail & Rental", "Legal", "Executive Management") map conceptually onto the fictional `DEPARTEMENTS` catalog much better than `Cost_Center` |
| CodeEmploi | `Job_Code` | confirmed direct match (e.g. `0077U`, `1361`) |
| TypeEmploi | `Time_Type` + `Worker_Type` combined | no single column matches; real data splits it — `Time_Type` gives "Full time"/"Part time", `Worker_Type` gives "Year Round"/"Seasonal"/"Temporary"/"Occasional". Likely displayed as e.g. "Full time — Seasonal" |
| GestionnaireImmediat | `Manager` | confirmed direct match, e.g. `Jean Leduc (201034)` |
| *(active/eligible check)* | `Employment_Status` (text: "Active"/"Inactive"), plus `Termination_Reason`, `Termination_Date` | `Employment_Status` reads cleaner than the numeric `Active_Status` column for this — confirm in Studio which one the "seuls les employés actifs" logic should key off |

### 2. Lists to create

#### "Demandes" (the main request list — covers all three request types)

| Column | Type | Notes |
|---|---|---|
| Title | Text | Request number, e.g. `INT-2025-00024` |
| TypeDemande | Choice | Nouvelle intégration / Réactivation / Avis de terminaison ou mise à pied temporaire |
| Employes | Lookup → **EMPLOYE_LIST**, **allow multiple values** | Onboarding/Réactivation always has exactly one; offboarding can have several |
| Statut | Choice | Brouillon, Soumise, En traitement, Complétée (default: Brouillon) |
| DemandePar | Person | |

No separate `DateCreation` column — SharePoint's built-in `Created`/`Créé` field already covers this, so it isn't duplicated.

**Onboarding/Réactivation-only columns:**

| Column | Type | Notes |
|---|---|---|
| DateEntreePrevue | Date | |
| RegleDePaye | Choice | 05H45 SANS REPAS, 7H30 AVEC 60 MIN DE REPAS, 7H30 AVEC 30 MIN DE REPAS, 8h SANS REPAS, 8H AVEC 30 MINUTES REPAS, 10H SANS REPAS, 10H AVEC 30 MINUTES REPAS, AUTRES PRÉCISÉ DANS COMMENTAIRES |
| RegleDePayeCommentaire | Text | shown/required only when RegleDePaye = "AUTRES..." |
| SystemesAcces | Choice (allow multiple) | Compte AD/courriel, Accès VPN, Badge d'accès aux édifices |
| BadgeZones | Text | shown only if Badge selected |
| SystemePOSHebergement | Choice (allow multiple) | RTP, SMS, OPERA, SYMPHONIE, APROPOS |
| StationnementRequis | Text | |
| JustificationAcces | Multi-line text | |
| Equipements | Choice (allow multiple) | see `EQUIPEMENTS` in catalogs.ts |
| NotesEquipement | Multi-line text | |
| Applications | Choice (allow multiple) | Microsoft 365, Teams, Dynamics 365 |
| AutreLogicielRequis | Multi-line text | |

**Offboarding-only columns:**

| Column | Type | Notes |
|---|---|---|
| DerniereJournee | Date | |
| IndemniteVacances | Choice | Oui / Non |
| RaisonArret | Choice | Fin de saison / mise à pied saisonnière, Mise à pied temporaire (manque de travail), Démission volontaire, Congédiement, Fin de contrat, Retraite, Autre |
| DetailsRaison | Multi-line text | |
| Reembaucheriez | Choice | Oui / Non / À déterminer |
| CommentairesIT | Multi-line text | |
| CommentairesParkingAcces | Multi-line text | |
| CommentairesRedingote | Multi-line text | |

**Important — "required" is enforced in the Canvas app, not in SharePoint:** none of these onboarding/offboarding-only columns are marked "Require that this column contains information" at the SharePoint level, even the ones the prototype treats as mandatory (`DateEntreePrevue`, `DetailsRaison`, etc.). Since one shared `DEMANDES` list holds all three request types, a SharePoint-level required column would block saving items of the *other* two types that don't use that field. Conditional required-ness (e.g. `DetailsRaison` required only when submitting an offboarding request) must be implemented as Power Fx validation in the Canvas app screens instead.

Attachments: use the list's **native attachment capability** (every SharePoint list item supports file attachments out of the box) — no custom column needed.

#### "Demandes - Commentaires RH" (separate list, restricted permissions)

The RH comment box on the offboarding flow is meant to be genuinely confidential — SharePoint doesn't support column-level security, only list/item-level, so it needs its own list with broken permission inheritance, shared only with an HR security group.

**Status: created.** Columns:

| Column | Type | Notes |
|---|---|---|
| DemandeId | Number | stores the related DEMANDES item ID |
| CommentaireRH | Multi-line text | |

Permissions: inheritance from the site is broken. `POWERAPP FORMS Owners` keeps Full Control (standard for site admins); `POWERAPP FORMS Members`/`Visitors` were removed; the Azure AD security group **`TRM-RH-ADM`** was granted **Edit** access — it's the only non-owner group that can see this list's contents.

### 3. Build the app in Power Apps Studio

Screen-by-screen, using this prototype as the reference for exact copy, field order, validation rules, and conditional logic (e.g., the "AUTRES..." pay rule reveals a comment box; selecting "Badge" reveals a zones field; the department-comments step only shows for the offboarding flow; step count/nav changes depending on `TypeDemande`).

### 4. Share the app

Share directly with a security group or specific users from Power Apps Studio/the maker portal — no Teams admin unblock needed, since this is a standard Canvas App using only the SharePoint connector.

## Design reference

Visual design (colors, layout, step structure) — Tremblant red (`#9c1c2e`) accents, card-based multi-step layout, right-hand summary sidebar with progress tracking, real Tremblant logo and staff photo in `src/assets/`.
