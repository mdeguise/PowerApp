import { useState } from 'react';
import { useWizard } from '../context/WizardContext';
import { Field } from '../components/FormField';
import { StepFooter } from '../components/StepFooter';
import { UserIcon, SearchIcon, InfoIcon } from '../components/icons';
import { EMPLOYEE_DIRECTORY, REGLES_DE_PAYE, REGLE_DE_PAYE_AUTRE } from '../data/catalogs';
import { TYPE_DEMANDE_TERMINAISON, type EmployeeSelectionInfo, type TypeDemande } from '../types';

function initials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
}

export function Step1Employee() {
  const { request, setRequest, setTypeDemande } = useWizard();
  const e = request.employee;
  const isTermination = request.typeDemande === TYPE_DEMANDE_TERMINAISON;
  const [query, setQuery] = useState('');

  const selected = EMPLOYEE_DIRECTORY.find((emp) => emp.id === e.employeeId) ?? null;
  const terminationEmployees = EMPLOYEE_DIRECTORY.filter((emp) => request.offboarding.employeeIds.includes(emp.id));

  const q = query.trim().toLowerCase();
  const results = q
    ? EMPLOYEE_DIRECTORY.filter(
        (emp) =>
          (emp.numeroEmploye.toLowerCase().includes(q) ||
            emp.nom.toLowerCase().includes(q) ||
            emp.prenom.toLowerCase().includes(q)) &&
          !request.offboarding.employeeIds.includes(emp.id),
      ).slice(0, 6)
    : [];

  const update = (patch: Partial<EmployeeSelectionInfo>) => {
    setRequest((prev) => ({ ...prev, employee: { ...prev.employee, ...patch } }));
  };

  const selectEmployee = (id: string) => {
    update({ employeeId: id });
    setQuery('');
  };

  const clearSelection = () => update({ employeeId: null });

  const addTerminationEmployee = (id: string) => {
    setRequest((prev) => {
      if (prev.offboarding.employeeIds.includes(id)) return prev;
      return { ...prev, offboarding: { ...prev.offboarding, employeeIds: [...prev.offboarding.employeeIds, id] } };
    });
    setQuery('');
  };

  const removeTerminationEmployee = (id: string) => {
    setRequest((prev) => ({
      ...prev,
      offboarding: { ...prev.offboarding, employeeIds: prev.offboarding.employeeIds.filter((x) => x !== id) },
    }));
  };

  const handleTypeChange = (typeDemande: TypeDemande) => setTypeDemande(typeDemande);

  return (
    <div className="step-panel">
      <div className="step-panel__header">
        <span className="step-panel__icon">
          <UserIcon style={{ width: 22, height: 22 }} />
        </span>
        <div>
          <div className="step-panel__title">{isTermination ? 'Sélection des employés' : "Sélection de l'employé"}</div>
          <div className="step-panel__subtitle">
            {isTermination
              ? "Recherchez et sélectionnez un ou plusieurs employés visés par cet avis"
              : "Recherchez l'employé à intégrer par numéro d'employé, nom ou prénom"}
          </div>
        </div>
      </div>

      <Field label="Type de demande" required>
        <div className="type-demande-grid">
          <button
            type="button"
            className={`type-demande-option${request.typeDemande === 'Nouvelle intégration' ? ' type-demande-option--selected' : ''}`}
            onClick={() => handleTypeChange('Nouvelle intégration')}
          >
            <span className="type-demande-option__radio">
              {request.typeDemande === 'Nouvelle intégration' && <span className="type-demande-option__radio-dot" />}
            </span>
            <span>
              <div className="type-demande-option__title">Nouvelle intégration</div>
              <div className="type-demande-option__desc">
                Cette personne n'a jamais eu de dossier actif chez Tremblant
              </div>
            </span>
          </button>
          <button
            type="button"
            className={`type-demande-option${request.typeDemande === 'Réactivation' ? ' type-demande-option--selected' : ''}`}
            onClick={() => handleTypeChange('Réactivation')}
          >
            <span className="type-demande-option__radio">
              {request.typeDemande === 'Réactivation' && <span className="type-demande-option__radio-dot" />}
            </span>
            <span>
              <div className="type-demande-option__title">Réactivation</div>
              <div className="type-demande-option__desc">
                Cette personne revient après une terminaison ou une mise à pied
              </div>
            </span>
          </button>
          <button
            type="button"
            className={`type-demande-option${isTermination ? ' type-demande-option--selected' : ''}`}
            onClick={() => handleTypeChange(TYPE_DEMANDE_TERMINAISON)}
          >
            <span className="type-demande-option__radio">{isTermination && <span className="type-demande-option__radio-dot" />}</span>
            <span>
              <div className="type-demande-option__title">Avis de terminaison ou mise à pied temporaire</div>
              <div className="type-demande-option__desc">
                Cette personne quitte définitivement ou temporairement son poste
              </div>
            </span>
          </button>
        </div>
      </Field>

      {!isTermination && (
        <div className="workday-notice">
          <InfoIcon className="workday-notice__icon" />
          <ul>
            <li>
              Seuls les employés actifs dans Workday apparaîtront dans la liste ci-dessous. Par <strong>actif</strong>,
              on entend un dossier qui n'est pas en mode Terminaison — un employé en mode mise à pied est considéré actif.
            </li>
            <li>
              Si l'employé n'apparaît pas dans la liste déroulante, veuillez contacter votre partenaire d'affaires RH
              afin de faire activer le dossier de l'employé dans Workday.
            </li>
            <li>
              Veuillez également noter que l'équipe informatique ne peut créer les comptes utilisateurs informatiques,
              incluant le compte AD, qu'à partir de 48 heures avant la première journée de travail de l'employé, selon
              la date de début du poste principal indiquée dans Workday.
            </li>
          </ul>
        </div>
      )}

      {isTermination ? (
        <>
          <div className="workday-notice">
            <InfoIcon className="workday-notice__icon" />
            <div className="workday-notice__text">
              <p>
                Vous pouvez sélectionner plusieurs employés pour cet avis. Recherchez chaque employé par numéro
                d'employé, nom ou prénom, puis cliquez sur son nom dans la liste de résultats pour l'ajouter. Répétez
                l'opération pour chaque employé additionnel visé par le même avis.
              </p>
              <p>Vous pouvez retirer un employé de la sélection en cliquant sur « Retirer » à côté de son nom.</p>
            </div>
          </div>

          <Field label="Rechercher des employés" required>
            <div className="employee-search">
              <SearchIcon className="employee-search__icon" />
              <input
                type="text"
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                placeholder="Numéro d'employé, nom ou prénom"
                autoComplete="off"
              />
              {q && (
                <div className="employee-results">
                  {results.length ? (
                    results.map((emp) => (
                      <div key={emp.id} className="employee-result-item" onClick={() => addTerminationEmployee(emp.id)}>
                        <span className="employee-result-item__avatar">{initials(emp.prenom, emp.nom)}</span>
                        <span>
                          <div className="employee-result-item__name">
                            {emp.prenom} {emp.nom}
                          </div>
                          <div className="employee-result-item__meta">
                            #{emp.numeroEmploye} · {emp.poste} · {emp.departement}
                          </div>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="employee-result-empty">Aucun employé ne correspond à cette recherche.</div>
                  )}
                </div>
              )}
            </div>
          </Field>

          {terminationEmployees.length > 0 && (
            <div className="choice-list">
              {terminationEmployees.map((emp) => (
                <div key={emp.id} className="employee-selected-card">
                  <span className="employee-selected-card__avatar">{initials(emp.prenom, emp.nom)}</span>
                  <span>
                    <div className="employee-selected-card__name">
                      {emp.prenom} {emp.nom}
                    </div>
                    <div className="employee-selected-card__meta">
                      #{emp.numeroEmploye} · {emp.poste} · {emp.departement}
                    </div>
                  </span>
                  <button
                    type="button"
                    className="employee-selected-card__change"
                    onClick={() => removeTerminationEmployee(emp.id)}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!selected && (
            <Field label="Rechercher un employé" required>
              <div className="employee-search">
                <SearchIcon className="employee-search__icon" />
                <input
                  type="text"
                  value={query}
                  onChange={(ev) => setQuery(ev.target.value)}
                  placeholder="Numéro d'employé, nom ou prénom"
                  autoComplete="off"
                />
                {q && (
                  <div className="employee-results">
                    {results.length ? (
                      results.map((emp) => (
                        <div key={emp.id} className="employee-result-item" onClick={() => selectEmployee(emp.id)}>
                          <span className="employee-result-item__avatar">{initials(emp.prenom, emp.nom)}</span>
                          <span>
                            <div className="employee-result-item__name">
                              {emp.prenom} {emp.nom}
                            </div>
                            <div className="employee-result-item__meta">
                              #{emp.numeroEmploye} · {emp.poste} · {emp.departement}
                            </div>
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="employee-result-empty">Aucun employé ne correspond à cette recherche.</div>
                    )}
                  </div>
                )}
              </div>
            </Field>
          )}

          {selected && (
            <div className="employee-selected-card">
              <span className="employee-selected-card__avatar">{initials(selected.prenom, selected.nom)}</span>
              <span>
                <div className="employee-selected-card__name">
                  {selected.prenom} {selected.nom}
                </div>
                <div className="employee-selected-card__meta">
                  #{selected.numeroEmploye} · {selected.poste} · {selected.departement}
                </div>
              </span>
              <button type="button" className="employee-selected-card__change" onClick={clearSelection}>
                Changer
              </button>
            </div>
          )}

          <div className="field-grid field-grid--2">
            <Field label="Date d'entrée prévue" required valid={Boolean(e.dateEntreePrevue)}>
              <input type="date" value={e.dateEntreePrevue} onChange={(ev) => update({ dateEntreePrevue: ev.target.value })} />
            </Field>
            <Field label="Règle de paye" required valid={Boolean(e.regleDePaye)}>
              <select value={e.regleDePaye} onChange={(ev) => update({ regleDePaye: ev.target.value })}>
                <option value="">Sélectionner</option>
                {REGLES_DE_PAYE.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {e.regleDePaye === REGLE_DE_PAYE_AUTRE && (
            <Field label="Précisez la règle de paye" required valid={Boolean(e.regleDePayeCommentaire)}>
              <input
                type="text"
                value={e.regleDePayeCommentaire}
                onChange={(ev) => update({ regleDePayeCommentaire: ev.target.value })}
                placeholder="Précisez la règle de paye applicable"
              />
            </Field>
          )}
        </>
      )}

      <div className="required-note">
        <InfoIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
        Les champs marqués d'un * sont obligatoires.
      </div>

      <StepFooter />
    </div>
  );
}
