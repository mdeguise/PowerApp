# Power Fx reference — Canvas App rebuild

Companion to the [README](README.md)'s "Rebuilding as a Canvas App" section. That doc covers *what* the SharePoint
lists and field mappings are; this one covers *how* to reproduce the prototype's wizard behavior — navigation,
validation, conditional visibility, multi-select handling, and submission — as Power Fx, screen by screen, translated
directly from `src/context/WizardContext.tsx` and `src/steps/*.tsx`.

Formulas here are written to be pasted into Studio and adjusted to actual control names — treat them as verified
logic, not verified syntax. A few spots are flagged **[decide in Studio]** where the prototype either hardcoded a
placeholder or the browser-app approach (React state, a `File[]` array, drag-and-drop) has no direct Power Fx
equivalent and a real choice needs making once you're in the maker environment.

## Conventions used below

- `gbl*` — global variable (`Set()`), persists across screen navigation. Canvas Apps reset per-screen `UpdateContext`
  variables when you leave a screen, so anything that must survive the multi-screen wizard has to be global.
- `col*` — collection (`ClearCollect()` / `Collect()`), used for multi-select choice state and the offboarding
  employee list.
- `scr*` — screen name.
- Named formulas (`App.Formulas` in Studio, Power Fx 3.0) are used for values computed the same way from multiple
  screens (`StepsActives`, `NombreEtapes`, `EtapeCouranteValide`) — define once, reference everywhere, instead of
  repeating the `If`/`Switch` on every screen.

## Screen model

The prototype is a single-page app that swaps a `StepComponent` in place (`App.tsx`); Canvas Apps navigate between
real screens instead. One screen per wizard step, matching `ONBOARDING_STEPS`/`OFFBOARDING_STEPS`:

| Screen | Used by | Corresponds to |
|---|---|---|
| `scrEmploye` | both flows | `Step1Employee.tsx` (branches its UI on `gblTypeDemande`, exactly like the prototype) |
| `scrPoste` | onboarding/réactivation | `Step2Position.tsx` |
| `scrAcces` | onboarding/réactivation | `Step3Access.tsx` |
| `scrEquipement` | onboarding/réactivation | `Step4Equipment.tsx` |
| `scrApplications` | onboarding/réactivation | `Step5Applications.tsx` |
| `scrRevisionOnboarding` | onboarding/réactivation | `Step6Review.tsx` |
| `scrCessation` | offboarding | `Step2Cessation.tsx` |
| `scrCommentaires` | offboarding | `Step3DepartmentComments.tsx` |
| `scrRevisionOffboarding` | offboarding | `StepReviewOffboarding.tsx` |

`StepNav`, `StepFooter`, `SummarySidebar`, and `Header` each appear on every screen in the prototype — build these as
**Component Library components** (with a `NumeroEtape` input where behavior needs to know which screen it's on) so
the nav/footer logic is written once, not duplicated across nine screens.

## App.OnStart — global state

```
// Wizard position (WizardContext: currentStep/furthestStep, 0-based there — 1-based here to match StepDescriptor.numero)
Set(gblCurrentStep, 1);
Set(gblFurthestStep, 1);
Set(gblTypeDemande, "");

// Mirrors OnboardingRequest, minus the multi-select array fields (handled as collections below)
// and minus the confidential RH comment (kept separate — see scrCommentaires).
//
// Every field below that isn't a plain "" or a literal string is seeded as a TYPED blank rather than bare Blank().
// A bare Blank() inside a Set()-constructed record carries no type, so the field's type is locked in as ambiguous —
// and any later Patch(gblDemande, {ThatField: <a real Date/record/etc.>}) then fails as "invalid arguments", because
// the value being patched in doesn't match a type that was never established. First(Filter(Source, false)) is the
// standard Power Fx idiom for a typed blank: zero rows, so it evaluates to blank, but still carries the source's
// schema for type-checking. EmployeSelectionne borrows its type from EMPLOYE_LIST; the two Date fields below borrow
// theirs from the real DEMANDES columns since there's no plain-literal equivalent for an empty Date.
//
// Data source name is DEMANDES (all caps) — that's the SharePoint list's actual title, and Power Fx data source
// names are case-sensitive, so `Demandes` silently fails to resolve as a table (shows up as "Filter has invalid
// arguments" rather than a clearer "not found" error). Also: Filter()'s SharePoint delegation rejects a bare
// boolean literal as the predicate — ID < 0 is a real always-false comparison against a real column instead.
//
// RegleDePaye/IndemniteVacances/RaisonArret deliberately do NOT borrow from blankDemande the way the Date fields
// do: DEMANDES' single-select Choice columns read back as a Record-shaped Choice type off a table row in this
// connector, not plain Text — while every other use of these fields (dropdown .Selected.Value, <> "..." string
// comparisons in the validation formulas below) assumes plain Text. Seeding with "" like the other Text fields
// keeps the type consistent with how they're actually used everywhere else.
Set(gblDemande,
    With(
        {blankDemande: First(Filter(DEMANDES, ID < 0))},
        {
            TypeDemande: "",
            DemandePar: User().FullName,
            Statut: "Brouillon",
            EmployeSelectionne: First(Filter(EMPLOYE_LIST, ID < 0)),
            DateEntreePrevue: blankDemande.DateEntreePrevue,
            RegleDePaye: "",
            RegleDePayeCommentaire: "",
            BadgeZones: "",
            StationnementRequis: "",
            JustificationAcces: "",
            NotesEquipement: "",
            AutreLogicielRequis: "",
            DerniereJournee: blankDemande.DerniereJournee,
            IndemniteVacances: "",
            RaisonArret: "",
            DetailsRaison: "",
            Reembaucheriez: "",
            CommentairesIT: "",
            CommentairesParkingAcces: "",
            CommentairesRedingote: ""
        }
    )
);
Set(gblCommentaireRH, "");   // deliberately NOT part of gblDemande — see "Confidential RH comment" below

// Offboarding: multiple employees per request (mirrors offboarding.employeeIds: string[])
ClearCollect(colEmployesOffboarding, EMPLOYE_LIST);
Clear(colEmployesOffboarding);

// Multi-select choice fields — hardcoded rather than pulled from Choices(DEMANDES.*).
// Choices() only works on single-select SharePoint Choice columns; it throws "invalid argument"
// on any column with "allow multiple values" turned on, which is every one of these. Values below
// were confirmed live against the real DEMANDES list (New Item form) — keep them in sync if the
// SharePoint Choice options are ever edited, since nothing here re-derives them automatically.
ClearCollect(colSystemesAcces,
    {Value: "Compte AD/courriel", Selected: false},
    {Value: "Accès VPN", Selected: false},
    {Value: "Badge d'accès aux édifices", Selected: false}
);
ClearCollect(colPOSHebergement,
    {Value: "RTP", Selected: false},
    {Value: "SMS", Selected: false},
    {Value: "OPERA", Selected: false},
    {Value: "SYMPHONIE", Selected: false},
    {Value: "APROPOS", Selected: false}
);
ClearCollect(colApplications,
    {Value: "Microsoft 365", Selected: false},
    {Value: "Teams", Selected: false},
    {Value: "Dynamics 365", Selected: false}
);

// Equipements needs the same hardcoding, plus a category alongside each value: catalogs.ts groups
// equipment into categories (Informatique / Télécommunications / Équipement de travail) for the
// step's section headers, which a plain Choice column has no room for either way.
ClearCollect(colEquipements,
    {Value: "Ordinateur portable",              Categorie: "Informatique",              Selected: false},
    {Value: "Ordinateur de bureau",              Categorie: "Informatique",              Selected: false},
    {Value: "Écran additionnel",                 Categorie: "Informatique",              Selected: false},
    {Value: "Téléphone cellulaire",               Categorie: "Télécommunications",        Selected: false},
    {Value: "Radio bidirectionnelle",             Categorie: "Télécommunications",        Selected: false},
    {Value: "Uniforme / vêtements corporatifs",   Categorie: "Équipement de travail",     Selected: false},
    {Value: "Laissez-passer de saison",           Categorie: "Équipement de travail",     Selected: false}
);

// Step descriptors — mirrors ONBOARDING_STEPS / OFFBOARDING_STEPS in WizardContext.tsx
ClearCollect(colStepsOnboarding,
    {Numero: 1, Titre: "Employé",                Ecran: "scrEmploye"},
    {Numero: 2, Titre: "Poste et département",   Ecran: "scrPoste"},
    {Numero: 3, Titre: "Accès et comptes",        Ecran: "scrAcces"},
    {Numero: 4, Titre: "Équipement",              Ecran: "scrEquipement"},
    {Numero: 5, Titre: "Applications",            Ecran: "scrApplications"},
    {Numero: 6, Titre: "Révision et soumission",  Ecran: "scrRevisionOnboarding"}
);
ClearCollect(colStepsOffboarding,
    {Numero: 1, Titre: "Employé(s)",                       Ecran: "scrEmploye"},
    {Numero: 2, Titre: "Détails de la cessation",           Ecran: "scrCessation"},
    {Numero: 3, Titre: "Commentaires par département",      Ecran: "scrCommentaires"},
    {Numero: 4, Titre: "Révision et soumission",             Ecran: "scrRevisionOffboarding"}
);
```

## Named formulas (App.Formulas)

```
StepsActives = If(gblTypeDemande = "Avis de terminaison ou mise à pied temporaire", colStepsOffboarding, colStepsOnboarding);
NombreEtapes = CountRows(StepsActives);

// validateStep(step, request) from WizardContext.tsx, ported 1:1 — note only step 1 (onboarding) and
// steps 1-2 (offboarding) actually gate the Next button. Every other step defaults to valid, same as the prototype
// (position/access/equipment/applications/department-comments have no hard-required fields blocking navigation,
// even though some of their inputs are visually marked with *).
ValidationEtape1Onboarding =
    !IsBlank(gblTypeDemande)
    && !IsBlank(gblDemande.EmployeSelectionne)
    && !IsBlank(gblDemande.DateEntreePrevue)
    && !IsBlank(gblDemande.RegleDePaye)
    && (gblDemande.RegleDePaye <> "AUTRES PRÉCISÉ DANS COMMENTAIRES" || !IsBlank(gblDemande.RegleDePayeCommentaire));

ValidationEtape1Offboarding = !IsBlank(gblTypeDemande) && CountRows(colEmployesOffboarding) > 0;

ValidationEtape2Offboarding =
    !IsBlank(gblDemande.DerniereJournee)
    && !IsBlank(gblDemande.IndemniteVacances)
    && !IsBlank(gblDemande.RaisonArret)
    && !IsBlank(gblDemande.DetailsRaison)
    && !IsBlank(gblDemande.Reembaucheriez);

EtapeCouranteValide = If(
    gblTypeDemande = "Avis de terminaison ou mise à pied temporaire",
    Switch(gblCurrentStep, 1, ValidationEtape1Offboarding, 2, ValidationEtape2Offboarding, true),
    Switch(gblCurrentStep, 1, ValidationEtape1Onboarding, true)
);
```

## Shared components

### `cmpStepNav` (→ `StepNav.tsx`)

Gallery, `Items = StepsActives`.

```
// per-item icon/state — isDone = index < furthestStep && !isActive, from StepNav.tsx
galItem.Fill / icon = Switch(true,
    ThisItem.Numero = gblCurrentStep, ActiveStyle,
    ThisItem.Numero < gblFurthestStep, DoneStyle /* show checkmark */,
    DefaultStyle /* show ThisItem.Numero */
)

// OnSelect — goToStep() has no restriction to already-visited steps; any nav item is clickable at any time
galItem.OnSelect = Set(gblCurrentStep, ThisItem.Numero);
    Set(gblFurthestStep, Max(gblFurthestStep, ThisItem.Numero));
    Navigate(ThisItem.Ecran, ScreenTransition.None)
```

### `cmpStepFooter` (→ `StepFooter.tsx`)

```
btnPrecedent.Visible = gblCurrentStep > 1
btnPrecedent.OnSelect =
    Set(gblCurrentStep, gblCurrentStep - 1);
    Navigate(LookUp(StepsActives, Numero = gblCurrentStep).Ecran, ScreenTransition.None)

// isLast ? "Soumettre" : "Suivant"
btnSuivant.Visible = gblCurrentStep < NombreEtapes
btnSuivant.DisplayMode = If(EtapeCouranteValide, DisplayMode.Edit, DisplayMode.Disabled)
btnSuivant.OnSelect =
    Set(gblCurrentStep, gblCurrentStep + 1);
    Set(gblFurthestStep, Max(gblFurthestStep, gblCurrentStep));
    Navigate(LookUp(StepsActives, Numero = gblCurrentStep).Ecran, ScreenTransition.None)

btnSoumettre.Visible = gblCurrentStep = NombreEtapes
// OnSelect defined per review screen below (submit payload differs by flow)
```

`Annuler` and `Enregistrer le brouillon` are inert in the prototype (no `onClick`) — **[decide in Studio]** whether
"save as draft" actually needs to write a `Statut = "Brouillon"` item to `DEMANDES` now, or stays a placeholder.

### `cmpSummarySidebar` (→ `SummarySidebar.tsx`)

```
lblProgression.Text = Text(gblCurrentStep) & " / " & Text(NombreEtapes) & " étapes"
rectProgressFill.Width = Parent.Width * (gblCurrentStep / NombreEtapes)
lblTypeDemande.Text = If(IsBlank(gblTypeDemande), "—", gblTypeDemande)
lblStatut.Text = gblDemande.Statut
```

## `scrEmploye` (→ `Step1Employee.tsx`)

### Type de demande (3 selectable cards)

```
btnNouvelleIntegration.OnSelect =
    Set(gblTypeDemande, "Nouvelle intégration");
    Set(gblDemande, Patch(gblDemande, {TypeDemande: "Nouvelle intégration"}));
    Set(gblFurthestStep, gblCurrentStep)   // matches setTypeDemande() resetting furthestStep to currentStep
```
Same pattern for `"Réactivation"` and `"Avis de terminaison ou mise à pied temporaire"`. Selected-state styling:
`Fill = If(gblTypeDemande = "Nouvelle intégration", SelectedColor, DefaultColor)`.

### Onboarding/réactivation branch (`Visible = gblTypeDemande <> "Avis de terminaison ou mise à pied temporaire"`)

Search uses `StartsWith()`, not a "contains anywhere" match like the prototype's `.includes()`. `EMPLOYE_LIST` has
~1,955 rows — well past the default 500-row delegation limit — so the search predicate has to be delegable to
SharePoint or results silently get truncated to whatever page loaded locally. Neither the `in` operator nor
`Search()` delegates reliably to SharePoint in this environment (both were tried and rejected by Studio);
`StartsWith()` is the one that's unambiguously delegable. Tradeoff: searching "leau" won't find "Bourbeau" anymore,
only names/numbers that start with what's typed — an acceptable, common pattern for an employee picker.

```
galResultats.Items = If(
    IsBlank(txtRecherche.Text),
    Blank(),
    FirstN(
        Filter(EMPLOYE_LIST,
            Employment_Status = "Active",
            StartsWith(Title, txtRecherche.Text) || StartsWith(Last_Name, txtRecherche.Text) || StartsWith(First_Name, txtRecherche.Text)
        ),
        6
    )
)
galResultats.OnSelect (item) = Set(gblDemande, Patch(gblDemande, {EmployeSelectionne: ThisItem})); Reset(txtRecherche)

grpFicheSelectionnee.Visible = !IsBlank(gblDemande.EmployeSelectionne)
btnChanger.OnSelect = Set(gblDemande, Patch(gblDemande, {EmployeSelectionne: Blank()}))

dtDateEntree.OnChange = Set(gblDemande, Patch(gblDemande, {DateEntreePrevue: dtDateEntree.SelectedDate}))

ddRegleDePaye.Items = Choices(DEMANDES.RegleDePaye)
ddRegleDePaye.OnChange = Set(gblDemande, Patch(gblDemande, {
    RegleDePaye: ddRegleDePaye.Selected.Value,
    RegleDePayeCommentaire: If(ddRegleDePaye.Selected.Value <> "AUTRES PRÉCISÉ DANS COMMENTAIRES", "", gblDemande.RegleDePayeCommentaire)
}))

txtRegleDePayeCommentaire.Visible = gblDemande.RegleDePaye = "AUTRES PRÉCISÉ DANS COMMENTAIRES"
txtRegleDePayeCommentaire.OnChange = Set(gblDemande, Patch(gblDemande, {RegleDePayeCommentaire: txtRegleDePayeCommentaire.Text}))
```

The "Seuls les employés actifs dans Workday..." notice is static text, `Visible` tied to the same condition as the
onboarding branch.

### Offboarding branch (`Visible = gblTypeDemande = "Avis de terminaison ou mise à pied temporaire"`)

```
galResultatsMulti.Items = If(
    IsBlank(txtRechercheMulti.Text),
    Blank(),
    FirstN(
        Filter(EMPLOYE_LIST,
            Employment_Status = "Active",
            IsBlank(LookUp(colEmployesOffboarding, Title = EMPLOYE_LIST[@Title])),   // exclude already-added
            StartsWith(Title, txtRechercheMulti.Text) || StartsWith(Last_Name, txtRechercheMulti.Text) || StartsWith(First_Name, txtRechercheMulti.Text)
        ),
        6
    )
)
galResultatsMulti.OnSelect (item) = Collect(colEmployesOffboarding, ThisItem); Reset(txtRechercheMulti)

galSelectionnes.Items = colEmployesOffboarding
btnRetirer.OnSelect (item) = Remove(colEmployesOffboarding, ThisItem)
```

`[Numero < gblFurthestStep]` disambiguation (`EMPLOYE_LIST[@Title]`) may need adjusting once the real column/record
scope is in front of you in Studio — this pattern is the standard workaround for filtering against a collection
inside a `Filter()` over a different table.

## `scrPoste` (→ `Step2Position.tsx`) — read-only

```
grpDetails.Visible = !IsBlank(gblDemande.EmployeSelectionne)
lblAvisSelection.Visible = IsBlank(gblDemande.EmployeSelectionne)  // "Veuillez d'abord sélectionner un employé..."

lblDepartement.Text   = gblDemande.EmployeSelectionne.Job_Family_Group
lblPoste.Text          = gblDemande.EmployeSelectionne.Position_Title
lblCodeEmploi.Text     = gblDemande.EmployeSelectionne.Job_Code
lblTypeEmploi.Text     = gblDemande.EmployeSelectionne.Time_Type & " — " & gblDemande.EmployeSelectionne.Worker_Type
lblGestionnaire.Text   = gblDemande.EmployeSelectionne.Manager
```

All fields are disabled inputs in the prototype (pulled straight from the employee record, never edited) — use
`Label` controls, not editable inputs, so there's no accidental drift from `EMPLOYE_LIST`.

## `scrAcces` (→ `Step3Access.tsx`)

```
galSystemesAcces.Items = colSystemesAcces
galSystemesAcces.OnSelect (item) = Patch(colSystemesAcces, ThisItem, {Selected: !ThisItem.Selected})

txtBadgeZones.Visible = LookUp(colSystemesAcces, Value = "Badge d'accès aux édifices").Selected
txtBadgeZones.OnChange = Set(gblDemande, Patch(gblDemande, {BadgeZones: txtBadgeZones.Text}))

galPOSHebergement.Items = colPOSHebergement
galPOSHebergement.OnSelect (item) = Patch(colPOSHebergement, ThisItem, {Selected: !ThisItem.Selected})

txtStationnement.OnChange = Set(gblDemande, Patch(gblDemande, {StationnementRequis: txtStationnement.Text}))
txtJustification.OnChange = Set(gblDemande, Patch(gblDemande, {JustificationAcces: txtJustification.Text}))
```

Note: `SYSTEMES_ACCES` in `catalogs.ts` has short internal ids (`'ad'`, `'vpn'`, `'badge'`) the prototype toggles and
compares against. A SharePoint Choice column has no separate id — only the display text — so the badge-visibility
check above matches on the full option text instead of `'badge'`. Keep the Choice option text exactly as documented
in the README's list-schema table so this comparison doesn't silently break on a future rename.

## `scrEquipement` (→ `Step4Equipment.tsx`)

```
galInformatique.Items = Filter(colEquipements, Categorie = "Informatique")
galTelecom.Items = Filter(colEquipements, Categorie = "Télécommunications")
galEquipementTravail.Items = Filter(colEquipements, Categorie = "Équipement de travail")
// each gallery's OnSelect: Patch(colEquipements, ThisItem, {Selected: !ThisItem.Selected})

txtNotesEquipement.OnChange = Set(gblDemande, Patch(gblDemande, {NotesEquipement: txtNotesEquipement.Text}))
```

The three "la demande pourra être évaluée / ne garantit pas..." paragraphs are static text, no logic.

## `scrApplications` (→ `Step5Applications.tsx`)

```
galApplications.Items = colApplications
galApplications.OnSelect (item) = Patch(colApplications, ThisItem, {Selected: !ThisItem.Selected})

txtAutreLogiciel.OnChange = Set(gblDemande, Patch(gblDemande, {AutreLogicielRequis: txtAutreLogiciel.Text}))
```

## `scrRevisionOnboarding` (→ `Step6Review.tsx`)

Read-only summary, one section per prior step, each with a "Modifier" link:

```
lnkModifierEmploye.OnSelect = Set(gblCurrentStep, 1); Navigate(scrEmploye, ScreenTransition.None)
lnkModifierPoste.OnSelect   = Set(gblCurrentStep, 2); Navigate(scrPoste, ScreenTransition.None)
// ...and so on for access (3), equipment (4), applications (5)

galTagsSystemesAcces.Items = Filter(colSystemesAcces, Selected).Value
galTagsPOSHebergement.Items = Filter(colPOSHebergement, Selected).Value
galTagsEquipements.Items = Filter(colEquipements, Selected).Value
galTagsApplications.Items = Filter(colApplications, Selected).Value
```

### Submit

```
btnSoumettre.OnSelect =
    Patch(
        DEMANDES,
        Defaults(DEMANDES),
        {
            Title: <numérotation — voir note ci-dessous>,
            TypeDemande: gblDemande.TypeDemande,
            Employes: [gblDemande.EmployeSelectionne],
            Statut: "Soumise",
            DemandePar: User().FullName,
            DateEntreePrevue: gblDemande.DateEntreePrevue,
            RegleDePaye: gblDemande.RegleDePaye,
            RegleDePayeCommentaire: gblDemande.RegleDePayeCommentaire,
            SystemesAcces: Filter(colSystemesAcces, Selected).Value,
            BadgeZones: gblDemande.BadgeZones,
            SystemePOSHebergement: Filter(colPOSHebergement, Selected).Value,
            StationnementRequis: gblDemande.StationnementRequis,
            JustificationAcces: gblDemande.JustificationAcces,
            Equipements: Filter(colEquipements, Selected).Value,
            NotesEquipement: gblDemande.NotesEquipement,
            Applications: Filter(colApplications, Selected).Value,
            AutreLogicielRequis: gblDemande.AutreLogicielRequis
        }
    );
    Set(varConfirmationVisible, true)
```

**[decide in Studio]** Request numbering: `createEmptyRequest()` hardcodes `"INT-2025-00024"` as a placeholder — the
prototype never actually generates one. A real scheme (e.g. `"INT-" & Text(Year(Now())) & "-" & Text(CountRows(DEMANDES) + 1, "00000")`,
a SharePoint autonumber column, or a Power Automate flow triggered on item creation) needs to be chosen; `CountRows`
on its own isn't safe against concurrent submissions if that matters here.

The confirmation dialog (`SubmissionModal.tsx`'s text) is a Popup/Notification screen or overlay `Visible` on
`varConfirmationVisible`, closed by setting it back to `false`.

## `scrCessation` (→ `Step2Cessation.tsx`)

```
lblAvisMultiple.Visible = CountRows(colEmployesOffboarding) > 1

dtDerniereJournee.OnChange = Set(gblDemande, Patch(gblDemande, {DerniereJournee: dtDerniereJournee.SelectedDate}))

ddIndemniteVacances.Items = Choices(DEMANDES.IndemniteVacances)
ddIndemniteVacances.OnChange = Set(gblDemande, Patch(gblDemande, {IndemniteVacances: ddIndemniteVacances.Selected.Value}))

ddRaisonArret.Items = Choices(DEMANDES.RaisonArret)
ddRaisonArret.OnChange = Set(gblDemande, Patch(gblDemande, {RaisonArret: ddRaisonArret.Selected.Value}))

txtDetailsRaison.OnChange = Set(gblDemande, Patch(gblDemande, {DetailsRaison: txtDetailsRaison.Text}))

ddReembaucheriez.Items = Choices(DEMANDES.Reembaucheriez)
ddReembaucheriez.OnChange = Set(gblDemande, Patch(gblDemande, {Reembaucheriez: ddReembaucheriez.Selected.Value}))
```

**[decide in Studio]** Attachments: the prototype holds a plain `File[]` in memory (add/remove, nothing uploaded
anywhere — there's no backend). In a Canvas App the natural match is the **Attachments control**, which binds
directly to a SharePoint list item's native attachment collection — but that control needs an existing list item to
attach to, and this screen runs *before* submit. Two workable approaches: (a) create the `DEMANDES` item as a
`"Brouillon"` early (e.g. on first entry to `scrCessation`) so `Attachments1.Attachments` has something to bind to
and gets patched to `"Soumise"` at final submit, or (b) keep files in a local collection through the wizard and only
wire the Attachments control in on the review screen right before `Patch()`. Test both — attachment controls in
Power Apps are known to behave differently against a not-yet-created vs. already-created item.

## `scrCommentaires` (→ `Step3DepartmentComments.tsx`)

```
txtCommentaireRH.OnChange = Set(gblCommentaireRH, txtCommentaireRH.Text)      // NOT gblDemande — see below
txtCommentaireIT.OnChange = Set(gblDemande, Patch(gblDemande, {CommentairesIT: txtCommentaireIT.Text}))
txtCommentaireParkingAcces.OnChange = Set(gblDemande, Patch(gblDemande, {CommentairesParkingAcces: txtCommentaireParkingAcces.Text}))
txtCommentaireRedingote.OnChange = Set(gblDemande, Patch(gblDemande, {CommentairesRedingote: txtCommentaireRedingote.Text}))
```

**Confidential RH comment — kept out of `gblDemande` on purpose.** The README already decided the RH comment needs
its own permission-restricted list (`Demandes - Commentaires RH`, shared only with `TRM-RH-ADM`) because SharePoint
has no column-level security. Storing the comment in a variable that's never part of the `DEMANDES` Patch payload —
rather than in `gblDemande` alongside everything else and just "remembering" to exclude that one field at submit
time — makes it structurally impossible to leak it into the shared list by a future editing mistake. The other three
department comments (IT, stationnement/accès, redingote) aren't marked confidential in the prototype and go into
`DEMANDES` normally.

## `scrRevisionOffboarding` (→ `StepReviewOffboarding.tsx`)

```
galTagsEmployes.Items = colEmployesOffboarding
// cessation details, and CommentairesIT/ParkingAcces/Redingote, read straight off gblDemande
// RH comment shown here too (from gblCommentaireRH) so the submitter can confirm it before sending — display only
lblCommentaireRH.Text = If(IsBlank(gblCommentaireRH), "—", gblCommentaireRH)
```

### Submit

Two list writes: the main request, then the RH comment — using `With()` to capture the new item's ID for the lookup
column on the second list, exactly the pattern the README's list design implies.

```
btnSoumettre.OnSelect =
    With(
        { nouvelleDemande:
            Patch(
                DEMANDES,
                Defaults(DEMANDES),
                {
                    Title: <numérotation — voir note ci-dessus>,
                    TypeDemande: gblTypeDemande,
                    Employes: colEmployesOffboarding,
                    Statut: "Soumise",
                    DemandePar: User().FullName,
                    DerniereJournee: gblDemande.DerniereJournee,
                    IndemniteVacances: gblDemande.IndemniteVacances,
                    RaisonArret: gblDemande.RaisonArret,
                    DetailsRaison: gblDemande.DetailsRaison,
                    Reembaucheriez: gblDemande.Reembaucheriez,
                    CommentairesIT: gblDemande.CommentairesIT,
                    CommentairesParkingAcces: gblDemande.CommentairesParkingAcces,
                    CommentairesRedingote: gblDemande.CommentairesRedingote
                }
            )
        },
        If(
            !IsBlank(gblCommentaireRH),
            Patch(
                'Demandes - Commentaires RH',
                Defaults('Demandes - Commentaires RH'),
                { DemandeId: nouvelleDemande.ID, CommentaireRH: gblCommentaireRH }
            )
        );
        Set(varConfirmationVisible, true)
    )
```

`If(!IsBlank(gblCommentaireRH), ...)` avoids creating an empty row in the restricted list when the manager left the
RH box blank — matches the prototype, which never required it.

## Open decisions carried over from this doc

- Request numbering scheme (both submit formulas above).
- Attachments control wiring against a not-yet-created item (`scrCessation`).
- Whether "Enregistrer le brouillon" needs real behavior or stays inert, as it is in the prototype.

These aren't guesses to resolve here — they're exactly the kind of thing to test directly in Studio, since Power Fx
and SharePoint's actual runtime behavior (especially around Attachments and concurrent autonumbering) is easy to get
wrong on paper.
