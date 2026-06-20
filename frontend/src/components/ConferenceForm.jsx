import { Save, X } from "lucide-react";
import { normalizeSector } from "../utils/formatters";

const emptyForm = {
  name: "",
  platform: "",
  physicalLocation: "",
  date: "",
  endDate: "",
  time: "",
  priority: "",
  responsible: "",
  department: "",
  link: "",
  notes: "",
  recurrenceType: "none",
  repeatUntil: "",
};

const platforms = [
  "Google Meet",
  "Microsoft Teams",
  "Zoom",
  "Webex",
  "UNA",
  "Presencial",
  "Outro",
];
const priorities = ["Baixa", "Média", "Alta", "Crítica"];
const recurrenceOptions = [
  { value: "none", label: "Não repetir" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const fields = {
  name: "conference-name",
  platform: "conference-platform",
  physicalLocation: "conference-physical-location",
  date: "conference-date",
  endDate: "conference-end-date",
  time: "conference-time",
  priority: "conference-priority",
  responsible: "conference-responsible",
  department: "conference-department",
  link: "conference-link",
  notes: "conference-notes",
  recurrenceType: "conference-recurrence-type",
  repeatUntil: "conference-repeat-until",
};

function ConferenceForm({
  formData,
  setFormData,
  errors,
  isEditing,
  onSubmit,
  onCancelEdit,
  isSaving,
}) {
  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const data = formData || emptyForm;

  return (
    <section className="panel no-print" aria-labelledby="form-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h2 id="form-title">
            {isEditing ? "Editar videoconferência" : "Nova videoconferência"}
          </h2>
        </div>
        {isEditing && (
          <button className="button ghost" type="button" onClick={onCancelEdit}>
            <X size={17} />
            Cancelar edição
          </button>
        )}
      </div>

      <form className="conference-form" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor={fields.name}>Nome da videoconferência *</label>
          <input
            id={fields.name}
            value={data.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ex.: Reunião de alinhamento"
            aria-describedby={errors.name ? `${fields.name}-error` : undefined}
          />
          {errors.name && (
            <small id={`${fields.name}-error`}>{errors.name}</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={fields.platform}>Plataforma *</label>
          <select
            id={fields.platform}
            value={data.platform}
            onChange={(event) => updateField("platform", event.target.value)}
            aria-describedby={
              errors.platform ? `${fields.platform}-error` : undefined
            }
          >
            <option value="">Selecione</option>
            {platforms.map((platform) => (
              <option value={platform} key={platform}>
                {platform}
              </option>
            ))}
          </select>
          {errors.platform && (
            <small id={`${fields.platform}-error`}>{errors.platform}</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={fields.physicalLocation}>Local da videoconferencia</label>
          <input
            id={fields.physicalLocation}
            value={data.physicalLocation}
            onChange={(event) => updateField("physicalLocation", event.target.value.toUpperCase())}
            placeholder="Ex.: AUDITORIO CGS"
          />
        </div>

        <div className="form-field">
          <label htmlFor={fields.date}>Data *</label>
          <input
            id={fields.date}
            type="date"
            value={data.date}
            onChange={(event) => updateField("date", event.target.value)}
            aria-describedby={errors.date ? `${fields.date}-error` : undefined}
          />
          {errors.date && (
            <small id={`${fields.date}-error`}>{errors.date}</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={fields.endDate}>Data final (opcional)</label>
          <input
            id={fields.endDate}
            type="date"
            value={data.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
            aria-describedby={errors.endDate ? `${fields.endDate}-error` : undefined}
          />
          {errors.endDate && (
            <small id={`${fields.endDate}-error`}>{errors.endDate}</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={fields.time}>Horário *</label>
          <input
            id={fields.time}
            type="time"
            value={data.time}
            onChange={(event) => updateField("time", event.target.value)}
            aria-describedby={errors.time ? `${fields.time}-error` : undefined}
          />
          {errors.time && (
            <small id={`${fields.time}-error`}>{errors.time}</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={fields.priority}>Prioridade *</label>
          <select
            id={fields.priority}
            value={data.priority}
            onChange={(event) => updateField("priority", event.target.value)}
            aria-describedby={
              errors.priority ? `${fields.priority}-error` : undefined
            }
          >
            <option value="">Selecione</option>
            {priorities.map((priority) => (
              <option value={priority} key={priority}>
                {priority}
              </option>
            ))}
          </select>
          {errors.priority && (
            <small id={`${fields.priority}-error`}>{errors.priority}</small>
          )}
        </div>

        {!isEditing && (
          <>
            <div className="form-field">
              <label htmlFor={fields.recurrenceType}>Repetir (opcional)</label>
              <select
                id={fields.recurrenceType}
                value={data.recurrenceType}
                onChange={(event) => updateField("recurrenceType", event.target.value)}
              >
                {recurrenceOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {data.recurrenceType !== "none" && (
              <div className="form-field">
                <label htmlFor={fields.repeatUntil}>Repetir até *</label>
                <input
                  id={fields.repeatUntil}
                  type="date"
                  value={data.repeatUntil}
                  onChange={(event) => updateField("repeatUntil", event.target.value)}
                  aria-describedby={errors.repeatUntil ? `${fields.repeatUntil}-error` : undefined}
                />
                {errors.repeatUntil && (
                  <small id={`${fields.repeatUntil}-error`}>{errors.repeatUntil}</small>
                )}
              </div>
            )}
          </>
        )}

        <div className="form-field">
          <label htmlFor={fields.responsible}>Responsável</label>
          <input
            id={fields.responsible}
            value={data.responsible}
            onChange={(event) => updateField("responsible", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={fields.department}>Setor</label>
          <input
            id={fields.department}
            value={data.department}
            onChange={(event) => updateField("department", normalizeSector(event.target.value))}
          />
        </div>

        <div className="form-field">
          <label htmlFor={fields.link}>Link da videoconferência</label>
          <input
            id={fields.link}
            value={data.link}
            onChange={(event) => updateField("link", event.target.value)}
            placeholder="https://..."
            aria-describedby={errors.link ? `${fields.link}-error` : undefined}
          />
          {errors.link && (
            <small id={`${fields.link}-error`}>{errors.link}</small>
          )}
        </div>

        <div className="form-field full-width">
          <label htmlFor={fields.notes}>Observações</label>
          <textarea
            id={fields.notes}
            value={data.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows="4"
            placeholder="Pauta, materiais necessários ou contexto da reunião."
          />
        </div>

        <div className="form-actions full-width">
          <button className="button primary" type="submit" disabled={isSaving}>
            <Save size={18} />
            {isSaving
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Adicionar"}
          </button>
        </div>
      </form>
    </section>
  );
}

export { emptyForm };
export default ConferenceForm;
