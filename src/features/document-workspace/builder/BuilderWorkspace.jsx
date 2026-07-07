import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronDown, Download, Eye, FileText, Info, PencilLine, RotateCcw, Settings2, Sparkles, Table2 } from 'lucide-react'
import { generateWorksheetRows } from './worksheetBuilder.js'
import { analyzeQuestionPaperBlueprint, generateQuestionPaperRows } from './questionPaperBuilder.js'
import { buildWorkbookFile, downloadWorkbook } from './buildWorkbook.js'
import PaperPreview from './PaperPreview.jsx'
import EditableQuestionPaper from './EditableQuestionPaper.jsx'
import {
  addInstruction as addInstructionToModel,
  addQuestion as addQuestionToModel,
  addSection as addSectionToModel,
  buildEditableResult,
  createEditableModelFromForm,
  createEmptyEditableModel,
  DEFAULT_PREVIEW_STYLE,
  deleteQuestion as deleteQuestionFromModel,
  editableModelToForm,
  PREVIEW_STYLES,
  removeInstruction as removeInstructionFromModel,
  removeSection as removeSectionFromModel,
  updateHeaderField,
  updateInstruction as updateInstructionInModel,
  updateQuestionField,
  updateSectionField,
} from './editablePaperModel.js'
import { composeWorksheetDocx } from '../composer/worksheetComposer.js'
import { composeQuestionPaperDocx } from '../composer/questionPaperComposer.js'
import { downloadDocxBlob } from '../composer/documentLayout.js'

// Builder-first teacher workspace: left = setup form, right = live PAPER preview
// (a real worksheet / question-paper document), with a Data View fallback. The
// composer produces a genuine one-click .docx from the same model the preview uses.

const GENERATORS = {
  worksheet: generateWorksheetRows,
  'question-paper': generateQuestionPaperRows,
}

const PREVIEW_ROW_LIMIT = 12
const MIN_BLUEPRINT_SECTIONS = 3
const MAX_BLUEPRINT_SECTIONS = 6

// v2.95.1 — The clean, paste-first left panel for "I already have questions" +
// Section-wise paper (before an editable paper is created). Only these fields
// show, in this order — no Paper Setup / blueprint / pattern / starter-bank fields.
const PASTE_FIRST_FIELD_IDS = [
  'questionSourceMode',
  'institution',
  'title',
  'grade',
  'subject',
  'examType',
  'duration',
  'teacherPastedMaterial',
]

const BLUEPRINT_SECTIONS = [
  {
    key: 'A',
    title: 'Section A',
    defaults: {
      enabled: true,
      title: 'Section A',
      instruction: 'Answer all questions.',
      marks: 1,
      totalQuestions: 5,
      mcqCount: 2,
      fillBlankCount: 2,
      trueFalseCount: 1,
      shortAnswerCount: 0,
      longAnswerCount: 0,
      easyCount: 3,
      mediumCount: 2,
      hardCount: 0,
    },
  },
  {
    key: 'B',
    title: 'Section B',
    defaults: {
      enabled: true,
      title: 'Section B',
      instruction: 'Answer all questions.',
      marks: 2,
      totalQuestions: 4,
      mcqCount: 0,
      fillBlankCount: 0,
      trueFalseCount: 0,
      shortAnswerCount: 4,
      longAnswerCount: 0,
      easyCount: 1,
      mediumCount: 2,
      hardCount: 1,
    },
  },
  {
    key: 'C',
    title: 'Section C',
    defaults: {
      enabled: true,
      title: 'Section C',
      instruction: 'Answer all questions.',
      marks: 3,
      totalQuestions: 3,
      mcqCount: 0,
      fillBlankCount: 0,
      trueFalseCount: 0,
      shortAnswerCount: 0,
      longAnswerCount: 3,
      easyCount: 0,
      mediumCount: 1,
      hardCount: 2,
    },
  },
  {
    key: 'D',
    title: 'Section D',
    defaults: {
      enabled: true,
      title: 'Section D',
      instruction: 'Answer all questions.',
      marks: 4,
      totalQuestions: 2,
      mcqCount: 0,
      fillBlankCount: 0,
      trueFalseCount: 0,
      shortAnswerCount: 0,
      longAnswerCount: 2,
      easyCount: 0,
      mediumCount: 1,
      hardCount: 1,
    },
  },
  {
    key: 'E',
    title: 'Section E',
    defaults: {
      enabled: true,
      title: 'Section E',
      instruction: 'Answer any one question.',
      marks: 5,
      totalQuestions: 2,
      mcqCount: 0,
      fillBlankCount: 0,
      trueFalseCount: 0,
      shortAnswerCount: 0,
      longAnswerCount: 2,
      easyCount: 0,
      mediumCount: 1,
      hardCount: 1,
    },
  },
  {
    key: 'F',
    title: 'Section F',
    defaults: {
      enabled: true,
      title: 'Section F',
      instruction: 'Higher-order thinking questions.',
      marks: 5,
      totalQuestions: 1,
      mcqCount: 0,
      fillBlankCount: 0,
      trueFalseCount: 0,
      shortAnswerCount: 0,
      longAnswerCount: 1,
      easyCount: 0,
      mediumCount: 0,
      hardCount: 1,
    },
  },
]

function defaultsFromFields(fields) {
  return fields.reduce((values, field) => {
    values[field.id] = field.default
    return values
  }, {})
}

function isFieldVisible(field, values) {
  if (!field.showIf) {
    return true
  }
  return Object.entries(field.showIf).every(([key, allowed]) => {
    const set = Array.isArray(allowed) ? allowed : [allowed]
    return set.includes(values[key])
  })
}

function slugForFile(value, fallback) {
  const slug = String(value || '').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return slug || fallback
}

function FieldControl({ field, value, onChange }) {
  const helper = field.helper ? (
    <span className="text-[11px] font-normal leading-4 text-slate-400">{field.helper}</span>
  ) : null

  if (field.type === 'toggle') {
    return (
      <div className="grid gap-1">
        <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">{field.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.id, event.target.checked)}
            className="h-4 w-4 accent-accentTeal"
          />
        </label>
        {helper}
      </div>
    )
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{field.label}</span>
      {field.type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value ?? ''}
          rows={3}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary outline-none focus:border-accentBlue"
        />
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
        />
      )}
      {helper}
    </label>
  )
}

function blueprintField(sectionKey, field) {
  return `section${sectionKey}${field.charAt(0).toUpperCase()}${field.slice(1)}`
}

function numberValue(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function BlueprintInput({ label, value, type = 'number', onChange, min = 0 }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</span>
      <input
        type={type}
        min={type === 'number' ? min : undefined}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
      />
    </label>
  )
}

function QuestionBlueprintPanel({ values, onChange, analysis }) {
  const getValue = (section, field) => {
    const id = blueprintField(section.key, field)
    return values[id] ?? section.defaults[field]
  }
  const rawSectionCount = numberValue(values.teacherBlueprintSectionCount, MIN_BLUEPRINT_SECTIONS)
  const sectionCount = Math.min(MAX_BLUEPRINT_SECTIONS, Math.max(MIN_BLUEPRINT_SECTIONS, Math.round(rawSectionCount)))
  const visibleSections = BLUEPRINT_SECTIONS.slice(0, sectionCount)

  function addSection() {
    if (sectionCount < MAX_BLUEPRINT_SECTIONS) {
      onChange('teacherBlueprintSectionCount', sectionCount + 1)
    }
  }

  function removeLastSection() {
    if (sectionCount > MIN_BLUEPRINT_SECTIONS) {
      onChange('teacherBlueprintSectionCount', sectionCount - 1)
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Teacher Section Blueprint</p>
          <p className="mt-1 text-xs leading-5 text-teal-800">
            Add more sections if your paper needs extra parts. If counts do not match, Project Atlas normalizes safely and uses labelled placeholders where starter-bank questions are not available.
          </p>
          <p className="mt-1 text-xs font-semibold text-teal-700">Sections: {sectionCount} / {MAX_BLUEPRINT_SECTIONS}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addSection}
            disabled={sectionCount >= MAX_BLUEPRINT_SECTIONS}
            className="focus-ring inline-flex min-h-8 items-center rounded-md bg-accentTeal px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Section
          </button>
          {sectionCount > MIN_BLUEPRINT_SECTIONS ? (
            <button
              type="button"
              onClick={removeLastSection}
              className="focus-ring inline-flex min-h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-700"
            >
              Remove Last
            </button>
          ) : null}
        </div>
      </div>

      {analysis ? (
        <div className="mt-3 rounded-md border border-teal-200 bg-white p-3">
          <div className="grid gap-2 text-xs sm:grid-cols-4">
            <span className="rounded-md bg-slate-50 px-2.5 py-2 font-semibold text-slate-700">
              {analysis.totalQuestions} questions
            </span>
            <span className="rounded-md bg-slate-50 px-2.5 py-2 font-semibold text-slate-700">
              {analysis.totalMarks} marks
            </span>
            <span className="rounded-md bg-blue-50 px-2.5 py-2 font-semibold text-blue-700">
              Est. real: {analysis.estimatedRealQuestionCount}
            </span>
            <span className="rounded-md bg-amber-50 px-2.5 py-2 font-semibold text-amber-700">
              Est. placeholders: {analysis.estimatedPlaceholderCount}
            </span>
          </div>
          {analysis.blockingWarnings.length ? (
            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
              {analysis.blockingWarnings.map((warning) => (
                <p key={warning} className="text-xs font-medium leading-5 text-rose-700">{warning}</p>
              ))}
            </div>
          ) : null}
          {analysis.warnings.length ? (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold text-amber-800">Teacher heads-up</p>
              {analysis.warnings.slice(0, 4).map((warning) => (
                <p key={warning} className="mt-1 text-xs leading-5 text-amber-800">{warning}</p>
              ))}
              {analysis.warnings.length > 4 ? (
                <p className="mt-1 text-xs font-medium text-amber-700">More section notes are shown inside the section cards below.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        {visibleSections.map((section) => {
          const enabledId = blueprintField(section.key, 'enabled')
          const enabled = getValue(section, 'enabled') !== false
          const total = numberValue(getValue(section, 'totalQuestions'), section.defaults.totalQuestions)
          const typeTotal = ['mcqCount', 'fillBlankCount', 'trueFalseCount', 'shortAnswerCount', 'longAnswerCount']
            .reduce((sum, field) => sum + numberValue(getValue(section, field)), 0)
          const difficultyTotal = ['easyCount', 'mediumCount', 'hardCount']
            .reduce((sum, field) => sum + numberValue(getValue(section, field)), 0)
          const sectionSummary = analysis?.sectionSummaries.find((item) => item.key === section.key)

          return (
            <div key={section.key} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => onChange(enabledId, event.target.checked)}
                    className="h-4 w-4 accent-accentTeal"
                  />
                  {section.title}
                </label>
                <span className="text-xs font-semibold text-slate-500">{total} questions · {total * numberValue(getValue(section, 'marks'), section.defaults.marks)} marks</span>
              </div>

              {enabled ? (
                <>
                  {sectionSummary ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{sectionSummary.totalQuestions} q</span>
                      <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{sectionSummary.totalMarks} marks</span>
                      <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Est. real {sectionSummary.estimatedRealQuestionCount}</span>
                      <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">Est. placeholders {sectionSummary.estimatedPlaceholderCount}</span>
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <BlueprintInput label="Section title" type="text" value={getValue(section, 'title')} onChange={(value) => onChange(blueprintField(section.key, 'title'), value)} />
                    <BlueprintInput label="Instruction" type="text" value={getValue(section, 'instruction')} onChange={(value) => onChange(blueprintField(section.key, 'instruction'), value)} />
                    <BlueprintInput label="Marks/question" value={getValue(section, 'marks')} onChange={(value) => onChange(blueprintField(section.key, 'marks'), value)} min={1} />
                    <BlueprintInput label="Total questions" value={getValue(section, 'totalQuestions')} onChange={(value) => onChange(blueprintField(section.key, 'totalQuestions'), value)} min={1} />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    <BlueprintInput label="MCQ" value={getValue(section, 'mcqCount')} onChange={(value) => onChange(blueprintField(section.key, 'mcqCount'), value)} />
                    <BlueprintInput label="Fill blanks" value={getValue(section, 'fillBlankCount')} onChange={(value) => onChange(blueprintField(section.key, 'fillBlankCount'), value)} />
                    <BlueprintInput label="True/False" value={getValue(section, 'trueFalseCount')} onChange={(value) => onChange(blueprintField(section.key, 'trueFalseCount'), value)} />
                    <BlueprintInput label="Short" value={getValue(section, 'shortAnswerCount')} onChange={(value) => onChange(blueprintField(section.key, 'shortAnswerCount'), value)} />
                    <BlueprintInput label="Long" value={getValue(section, 'longAnswerCount')} onChange={(value) => onChange(blueprintField(section.key, 'longAnswerCount'), value)} />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <BlueprintInput label="Easy" value={getValue(section, 'easyCount')} onChange={(value) => onChange(blueprintField(section.key, 'easyCount'), value)} />
                    <BlueprintInput label="Medium" value={getValue(section, 'mediumCount')} onChange={(value) => onChange(blueprintField(section.key, 'mediumCount'), value)} />
                    <BlueprintInput label="Hard" value={getValue(section, 'hardCount')} onChange={(value) => onChange(blueprintField(section.key, 'hardCount'), value)} />
                  </div>

                  {sectionSummary?.warnings.length ? (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      {sectionSummary.warnings.map((warning) => (
                        <p key={warning} className="text-xs font-medium leading-5 text-amber-800">{warning}</p>
                      ))}
                      {typeTotal !== total || difficultyTotal !== total ? (
                        <p className="mt-1 text-xs font-medium leading-5 text-amber-700">Project Atlas will normalize this section safely.</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BuilderWorkspace({ config, state, actions, onUseInWorkspace }) {
  const builder = config.builder
  const generate = GENERATORS[builder.builderType] || GENERATORS.worksheet
  const isPaper = builder.builderType === 'question-paper'
  const [formValues, setFormValues] = useState(() => ({
    ...defaultsFromFields(builder.fields),
    ...(state.builderConfig || {}),
  }))
  const [previewMode, setPreviewMode] = useState('paper')
  const [using, setUsing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  // v2.96 — Paper Editor Canvas: the editable paper the teacher edits directly.
  // For the AR-QUESTION-PRO main flow it is created up-front so the editor is the
  // first thing shown (no setup grid). Lives only in the browser.
  const [editableModel, setEditableModel] = useState(() => {
    const initial = { ...defaultsFromFields(builder.fields), ...(state.builderConfig || {}) }
    const isEditorFirst = builder.builderType === 'question-paper'
      && initial.questionSourceMode === 'pasted-material'
      && (initial.pastedInputMode ?? 'prepared-paper') === 'prepared-paper'
    return isEditorFirst ? createEmptyEditableModel(initial) : null
  })
  // Canvas view: 'edit' to prepare the paper, 'preview' to see the final paper.
  const [paperMode, setPaperMode] = useState('edit')
  const [previewStyle, setPreviewStyle] = useState(DEFAULT_PREVIEW_STYLE)
  const [showImport, setShowImport] = useState(false)
  const [showCanvasAdvanced, setShowCanvasAdvanced] = useState(false)
  const formRef = useRef(null)
  const previewRef = useRef(null)

  // Live preview — regenerates from the current form. Deterministic + cheap, so the
  // paper updates as the teacher types (only pattern/range/count reshuffle questions).
  const result = useMemo(() => generate(formValues), [generate, formValues])
  const blueprintAnalysis = useMemo(
    () => (isPaper ? analyzeQuestionPaperBlueprint(formValues) : null),
    [formValues, isPaper],
  )
  const visibleFields = builder.fields.filter((field) => isFieldVisible(field, formValues))
  // v2.94 — "I already have questions" + Section-wise paper builds structure from
  // the paste itself, so Paper Setup / Custom Section Setup are hidden in the
  // simple view for that combination.
  const preparedActive = isPaper
    && formValues.questionSourceMode === 'pasted-material'
    && (formValues.pastedInputMode ?? 'prepared-paper') === 'prepared-paper'
  const simpleFields = visibleFields.filter((field) => !field.advanced && !(preparedActive && field.id === 'blueprintMode'))
  const advancedFields = visibleFields.filter((field) => field.advanced)
  // Question-paper pattern chips (Quick Pattern) live under Advanced; worksheet
  // presets stay in the simple flow.
  const showPaperPresetsInAdvanced = isPaper && Boolean(builder.presets?.length)
  const hasAdvanced = advancedFields.length > 0 || showPaperPresetsInAdvanced
  const showBlueprintPanel = isPaper && formValues.blueprintMode === 'teacher-blueprint' && !preparedActive

  // v2.96 — For the AR-QUESTION-PRO main flow (pasted-material + prepared-paper),
  // the Paper Editor Canvas replaces the classic setup grid entirely. Other
  // question sources (reference / starter bank / plain-list) keep the classic layout.
  const editorFirst = preparedActive
  // When an editable paper exists it is the single source for preview + download.
  // Rows/blueprint come from the model; header edits merge over the form.
  const editableActive = editorFirst && Boolean(editableModel)
  const editableResult = useMemo(
    () => (editableActive ? buildEditableResult(editableModel) : null),
    [editableActive, editableModel],
  )
  const effectiveResult = editableResult || result
  const effectiveForm = editableActive ? editableModelToForm(editableModel, formValues) : formValues

  // v2.95.1 — Paste-first: prepared-paper flow before an editable paper exists.
  // The left panel shows only the clean paste-first fields and a "Create Editable
  // Paper" button; the right panel shows an empty "paste to begin" state instead
  // of the old generated placeholder preview.
  const pasteFirstActive = preparedActive && !editableActive
  const pasteFirstFields = pasteFirstActive
    ? PASTE_FIRST_FIELD_IDS
      .map((id) => builder.fields.find((field) => field.id === id))
      .filter((field) => field && isFieldVisible(field, formValues))
    : []

  // Keep the editable model in step with the flow: create an empty paper when the
  // editor-first flow becomes active, discard it when leaving so a stale model
  // can't drive another mode's preview.
  useEffect(() => {
    if (editorFirst && !editableModel) {
      setEditableModel(createEmptyEditableModel(formValues))
    } else if (!editorFirst && editableModel) {
      setEditableModel(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorFirst])

  // Persist the form to the workspace so edits survive navigation / restore and are
  // available to the "Continue to DOCX Layout" handoff. Runs on form change only.
  useEffect(() => {
    actions.updateState({ builderConfig: formValues, builderMode: 'build' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues])

  function handleField(id, value) {
    setFormValues((current) => ({ ...current, [id]: value }))
  }

  function handlePreset(preset) {
    setFormValues((current) => ({ ...current, ...preset.values }))
  }

  function handleEditInBuilder() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Teacher-facing "Generate / Update Preview". The preview already recomputes
  // from form values, so this re-runs the SAME generation path (no duplicate
  // logic, no separate paper state) and brings the preview into view.
  function handleGeneratePreview() {
    setFormValues((current) => ({ ...current }))
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // v2.95 — Build the editable paper from the pasted section-wise paper, then
  // bring the preview into view. Teacher edits happen in the editor after this.
  function handleCreateEditablePaper() {
    setEditableModel(createEditableModelFromForm(formValues))
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Return to the paste step so the teacher can re-paste / re-parse. Discards edits.
  function handleStartOver() {
    setEditableModel(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // v2.96 — Canvas: import a pasted section-wise paper into the editor (replacing
  // the current model), then collapse the import panel and switch to Edit mode.
  function handleImportIntoEditor() {
    setEditableModel(createEditableModelFromForm(formValues))
    setShowImport(false)
    setPaperMode('edit')
  }

  // Start a fresh blank paper in the canvas.
  function handleNewBlankPaper() {
    setEditableModel(createEmptyEditableModel(formValues))
    setPaperMode('edit')
  }

  const handleHeaderChange = (field, value) => setEditableModel((model) => (model ? updateHeaderField(model, field, value) : model))
  const handleAddInstruction = () => setEditableModel((model) => (model ? addInstructionToModel(model) : model))
  const handleUpdateInstruction = (index, value) => setEditableModel((model) => (model ? updateInstructionInModel(model, index, value) : model))
  const handleRemoveInstruction = (index) => setEditableModel((model) => (model ? removeInstructionFromModel(model, index) : model))
  const handleSectionChange = (sectionId, field, value) => setEditableModel((model) => (model ? updateSectionField(model, sectionId, field, value) : model))
  const handleQuestionChange = (sectionId, questionId, field, value) => setEditableModel((model) => (model ? updateQuestionField(model, sectionId, questionId, field, value) : model))
  const handleAddQuestion = (sectionId) => setEditableModel((model) => (model ? addQuestionToModel(model, sectionId) : model))
  const handleDeleteQuestion = (sectionId, questionId) => setEditableModel((model) => (model ? deleteQuestionFromModel(model, sectionId, questionId) : model))
  const handleAddSection = () => setEditableModel((model) => (model ? addSectionToModel(model) : model))
  const handleRemoveSection = (sectionId) => setEditableModel((model) => (model ? removeSectionFromModel(model, sectionId) : model))

  const sourceHelperText = isPaper
    ? {
      'reference-topic': 'Draft questions are created from your pasted material for teacher review.',
      'pasted-material': 'Paste your section-wise paper — sections, marks and question types are detected.',
      'starter-bank': 'Questions are selected from available starter-bank content.',
    }[formValues.questionSourceMode] || ''
    : ''

  const hasRows = Boolean(effectiveResult && effectiveResult.rows.length)
  const fileBase = `${config.productSlug}-${slugForFile(effectiveForm.title, 'document')}`

  function handleDownloadDocx() {
    if (!hasRows) {
      return
    }
    const blob = isPaper
      ? composeQuestionPaperDocx(effectiveForm, effectiveResult.rows, effectiveResult.blueprint)
      : composeWorksheetDocx(effectiveForm, effectiveResult.rows)
    downloadDocxBlob(blob, `${fileBase}.docx`)
  }

  function handleDownloadExcel() {
    if (!hasRows) {
      return
    }
    downloadWorkbook(effectiveResult.columns, effectiveResult.rows, `${fileBase}.xlsx`)
  }

  async function handleContinueToLayout() {
    if (!hasRows) {
      return
    }
    setUsing(true)
    try {
      const file = buildWorkbookFile(effectiveResult.columns, effectiveResult.rows, `${fileBase}.xlsx`)
      await onUseInWorkspace(file)
    } finally {
      setUsing(false)
    }
  }

  const previewRows = effectiveResult ? effectiveResult.rows.slice(0, PREVIEW_ROW_LIMIT) : []
  const activeNotice = editableActive ? '' : (result?.notice || '')
  const docxLabel = isPaper ? 'Download Question Paper DOCX' : 'Download Worksheet DOCX'

  // v2.96 — AR-QUESTION-PRO main flow: the Paper Editor Canvas. Editor-first, no
  // setup grid, no placeholder preview. Other question sources fall through to the
  // classic layout below.
  if (editorFirst) {
    const canvasResult = editableModel ? effectiveResult : null
    const canvasHasRows = Boolean(canvasResult && canvasResult.rows.length)
    const sourceField = builder.fields.find((field) => field.id === 'questionSourceMode')

    return (
      <section ref={previewRef} className="grid min-w-0 gap-4 scroll-mt-24">
        {/* Toolbar: identity, Edit/Preview modes, style, answer key, downloads */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-primary">Question Paper Editor</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Edit the header, instructions, sections and questions, then preview and download your paper.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Editor mode">
              {[
                { id: 'edit', label: 'Edit Paper', Icon: PencilLine },
                { id: 'preview', label: 'Preview Paper', Icon: Eye },
              ].map((option) => {
                const active = paperMode === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPaperMode(option.id)}
                    className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                      active ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                    }`}
                  >
                    <option.Icon size={14} aria-hidden="true" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Preview style</span>
              <div className="inline-flex flex-wrap gap-1.5">
                {PREVIEW_STYLES.map((style) => {
                  const active = previewStyle === style.id
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setPreviewStyle(style.id)}
                      className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-2.5 text-xs font-semibold transition ${
                        active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                      }`}
                    >
                      {style.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
              <input
                type="checkbox"
                checked={formValues.includeAnswerKey === true}
                onChange={(event) => handleField('includeAnswerKey', event.target.checked)}
                className="h-4 w-4 accent-accentTeal"
              />
              <span className="text-xs font-semibold text-slate-700">Include answer key</span>
            </label>
          </div>

          {canvasResult?.blueprint ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {canvasResult.blueprint.numSections} sections · {canvasResult.blueprint.totalQuestions} questions · {canvasResult.blueprint.totalMarks} marks
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={!canvasHasRows}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={16} aria-hidden="true" />
              Download DOCX
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={!canvasHasRows}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} aria-hidden="true" />
              Download Excel
            </button>
            <span className="text-[11px] text-slate-400">Add questions, then Download DOCX — ready to print or edit in Word.</span>
          </div>
        </div>

        {/* Optional import: paste an existing section-wise paper into the editor. */}
        <div className="rounded-lg border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowImport((open) => !open)}
            aria-expanded={showImport}
            className="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:text-primary"
          >
            <span className="inline-flex items-center gap-2">
              <FileText size={14} aria-hidden="true" />
              Paste an existing question paper (optional)
            </span>
            <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${showImport ? 'rotate-180' : ''}`} />
          </button>
          {showImport ? (
            <div className="border-t border-slate-200 px-3.5 py-3">
              <textarea
                value={formValues.teacherPastedMaterial ?? ''}
                rows={6}
                placeholder={'SECTION A | 1 MARK | MCQ\n\n1. Question text\n\nSECTION B | 2 MARKS | SHORT ANSWER\n\n1. Question text'}
                onChange={(event) => handleField('teacherPastedMaterial', event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary outline-none focus:border-accentBlue"
              />
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Add a heading like <span className="font-semibold">SECTION A | 1 MARK | MCQ</span> before each part. Importing replaces the current editor content; your question text is kept exactly as pasted.
              </p>
              <button
                type="button"
                onClick={handleImportIntoEditor}
                className="focus-ring mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accentTeal px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <ArrowRight size={14} aria-hidden="true" />
                Import into editor
              </button>
            </div>
          ) : null}
        </div>

        {/* Body: Edit mode (editor) or Preview mode (final paper). */}
        {paperMode === 'edit' ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <EditableQuestionPaper
              model={editableModel}
              notice={editableModel?.notice}
              showAnswerField={formValues.includeAnswerKey === true}
              onHeaderChange={handleHeaderChange}
              onAddInstruction={handleAddInstruction}
              onUpdateInstruction={handleUpdateInstruction}
              onRemoveInstruction={handleRemoveInstruction}
              onSectionChange={handleSectionChange}
              onQuestionChange={handleQuestionChange}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onAddSection={handleAddSection}
              onRemoveSection={handleRemoveSection}
            />
            <div className="mt-4 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={handleNewBlankPaper}
                className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Start a new blank paper
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Paper preview</p>
              <button
                type="button"
                onClick={() => setPaperMode('edit')}
                className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
              >
                <PencilLine size={13} aria-hidden="true" />
                Back to Edit Paper
              </button>
            </div>
            {canvasHasRows ? (
              <PaperPreview
                builderType={builder.builderType}
                form={effectiveForm}
                rows={canvasResult.rows}
                blueprint={canvasResult.blueprint}
                previewStyle={previewStyle}
              />
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">Add at least one question to preview the paper.</p>
                <p className="mt-1 text-xs text-slate-500">Switch to Edit Paper and type a question.</p>
              </div>
            )}
          </div>
        )}

        {/* Advanced: switch question source / open technical options. */}
        {sourceField || advancedFields.length ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowCanvasAdvanced((open) => !open)}
              aria-expanded={showCanvasAdvanced}
              className="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 size={14} aria-hidden="true" />
                Advanced options (other question sources, ready question library)
              </span>
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${showCanvasAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showCanvasAdvanced ? (
              <div className="grid gap-3 border-t border-slate-200 px-3.5 py-3 sm:grid-cols-2">
                {sourceField ? (
                  <div className="sm:col-span-2">
                    <FieldControl field={sourceField} value={formValues[sourceField.id]} onChange={handleField} />
                  </div>
                ) : null}
                {advancedFields.map((field) => (
                  <div key={field.id} className={field.full || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <FieldControl field={field} value={formValues[field.id]} onChange={handleField} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      {/* Left: teacher setup form */}
      <div ref={formRef} className="min-w-0 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 text-accentBlue">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-primary">
              {editableActive ? 'Edit your question paper' : pasteFirstActive ? 'Paste your question paper' : (builder.title || 'Build automatically')}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {editableActive
                ? 'Edit the header, sections and questions directly, then download the DOCX.'
                : pasteFirstActive
                  ? 'Add your paper details and paste your section-wise paper, then create an editable paper you can edit directly.'
                  : builder.description}
            </p>
          </div>
        </div>

        {/* Worksheet keeps its pattern presets in the simple flow; paper presets move to Advanced. */}
        {!isPaper && builder.presets?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{builder.presetLabel || 'Pattern'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {builder.presets.map((preset) => {
                const active = builder.presetMatch ? builder.presetMatch(formValues, preset) : false
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                      active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {editableActive ? (
          <EditableQuestionPaper
            model={editableModel}
            notice={editableModel.notice}
            showAnswerField={formValues.includeAnswerKey === true}
            onHeaderChange={handleHeaderChange}
            onSectionChange={handleSectionChange}
            onQuestionChange={handleQuestionChange}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
          />
        ) : pasteFirstActive ? (
          // v2.95.1 — Clean paste-first fields only. No Paper Setup / blueprint /
          // pattern / starter-bank fields before the editable paper is created.
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pasteFirstFields.map((field) => (
              <div key={field.id} className={field.full || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <FieldControl field={field} value={formValues[field.id]} onChange={handleField} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {simpleFields.map((field) => (
              <div key={field.id} className={field.full || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <FieldControl field={field} value={formValues[field.id]} onChange={handleField} />
              </div>
            ))}
          </div>
        )}

        {!editableActive && showBlueprintPanel ? (
          <QuestionBlueprintPanel values={formValues} onChange={handleField} analysis={blueprintAnalysis} />
        ) : null}

        {/* Advanced stays collapsed but reachable (e.g. to switch to plain-list). */}
        {!editableActive && hasAdvanced ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions((open) => !open)}
              aria-expanded={showAdvancedOptions}
              className="focus-ring flex w-full items-center justify-between gap-2 rounded-md px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 size={14} aria-hidden="true" />
                Advanced options
              </span>
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
            </button>
            {showAdvancedOptions ? (
              <div className="border-t border-slate-200 px-3.5 py-3">
                {showPaperPresetsInAdvanced ? (
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Advanced: Quick Pattern</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {builder.presets.map((preset) => {
                        const active = builder.presetMatch ? builder.presetMatch(formValues, preset) : false
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePreset(preset)}
                            className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                              active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                            }`}
                          >
                            {preset.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                {advancedFields.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {advancedFields.map((field) => (
                      <div key={field.id} className={field.full || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <FieldControl field={field} value={formValues[field.id]} onChange={handleField} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {!editableActive && builder.note ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
            <Info size={15} className="mt-0.5 shrink-0 text-accentBlue" aria-hidden="true" />
            <p className="text-xs leading-5 text-blue-800">{builder.note}</p>
          </div>
        ) : null}

        {/* Clear teacher action. Prepared-paper flow: paste → Create Editable Paper →
            edit → download. Editing: Start over to re-paste. Everything else keeps the
            Generate / Update Preview action. */}
        <div className="mt-5 border-t border-slate-200 pt-4">
          {editableActive ? (
            <>
              <button
                type="button"
                onClick={handleStartOver}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Start over (re-paste)
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Your edits update the preview live. Download the DOCX from the preview panel.
              </p>
            </>
          ) : preparedActive ? (
            <>
              <button
                type="button"
                onClick={handleCreateEditablePaper}
                className="focus-ring inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <PencilLine size={17} aria-hidden="true" />
                Create Editable Paper
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Paste your section-wise paper above, then edit each section and question directly.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="focus-ring inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <Sparkles size={17} aria-hidden="true" />
                Generate / Update Preview
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {sourceHelperText || 'Review the preview, then download your DOCX.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right: live paper preview + actions */}
      <div ref={previewRef} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
        {pasteFirstActive ? (
          // v2.95.1 — Before the editable paper is created, show a clean empty
          // state. No old generated placeholder preview / totals / placeholder rows.
          <div>
            <p className="text-sm font-semibold text-primary">Editable paper preview</p>
            <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-accentBlue">
                <FileText size={20} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Paste your question paper and click Create Editable Paper.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your editable paper will appear here.
              </p>
            </div>
            <ol className="mt-4 grid gap-2.5">
              {[
                { n: 1, label: 'Paste your section-wise paper' },
                { n: 2, label: 'Edit sections and questions' },
                { n: 3, label: 'Download DOCX' },
              ].map((step) => (
                <li key={step.n} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accentTeal text-xs font-bold text-white">{step.n}</span>
                  <span className="text-sm font-semibold text-slate-700">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{builder.previewTitle || 'Preview'}</p>
            <p className="text-[11px] text-slate-400">
              {editableActive ? 'Your edits appear here live.' : 'Use Generate / Update Preview after changing setup.'}
            </p>
            {effectiveResult?.blueprint ? (
              <p className="text-xs font-semibold text-slate-500">
                {effectiveResult.blueprint.numSections} sections · {effectiveResult.blueprint.totalQuestions} questions · {effectiveResult.blueprint.totalMarks} marks
              </p>
            ) : result?.meta ? (
              <p className="text-xs font-semibold text-slate-500">
                {result.meta.count} questions · {result.meta.difficulty} · range {result.meta.range}
              </p>
            ) : null}
          </div>
          {/* Paper Preview | Data View toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Preview mode">
            {[
              { id: 'paper', label: 'Paper preview', Icon: FileText },
              { id: 'data', label: 'Data view', Icon: Table2 },
            ].map((option) => {
              const active = previewMode === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPreviewMode(option.id)}
                  className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                    active ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  <option.Icon size={14} aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Always-visible compact action so the teacher can regenerate without scrolling setup */}
        {editableActive ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Editing your paper — the preview and DOCX below update as you type.</span>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePreview}
              className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              <Sparkles size={15} aria-hidden="true" />
              Generate / Update Preview
            </button>
            <span className="text-[11px] text-slate-400">Setup → Generate / Update Preview → review → download.</span>
          </div>
        )}

        {isPaper && effectiveResult?.blueprint ? (
          <div className="mt-3 grid gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800 sm:grid-cols-4">
            <span>Total questions: {effectiveResult.blueprint.totalQuestions}</span>
            <span>Total marks: {effectiveResult.blueprint.totalMarks}</span>
            {editableActive ? (
              <>
                <span>Your questions: {effectiveResult.blueprint.teacherMaterialCount ?? 0}</span>
                <span>Sections: {effectiveResult.blueprint.numSections}</span>
              </>
            ) : effectiveResult.blueprint.questionSourceMode === 'reference-topic' ? (
              <>
                <span>Draft questions: {effectiveResult.blueprint.draftQuestionCount ?? 0}</span>
                <span>Fallback drafts: {effectiveResult.blueprint.fallbackDraftCount ?? 0}</span>
              </>
            ) : (
              <>
                <span>Real bank questions: {effectiveResult.blueprint.questionBankCount ?? 0}</span>
                <span>Placeholders: {effectiveResult.blueprint.placeholderCount ?? 0}</span>
              </>
            )}
          </div>
        ) : null}

        {activeNotice ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-xs leading-5 text-amber-800">{activeNotice}</p>
          </div>
        ) : null}

        {!hasRows && !activeNotice ? (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">Set your options to build the {isPaper ? 'paper' : 'worksheet'}.</p>
            <p className="mt-1 text-xs text-slate-500">The document is generated in your browser.</p>
          </div>
        ) : null}

        {hasRows && previewMode === 'paper' ? (
          <PaperPreview builderType={builder.builderType} form={effectiveForm} rows={effectiveResult.rows} blueprint={effectiveResult.blueprint} />
        ) : null}

        {hasRows && previewMode === 'data' ? (
          <>
            <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {effectiveResult.columns.map((column) => (
                      <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50/60">
                      {effectiveResult.columns.map((column) => (
                        <td key={column} className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">
                          {row[column] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {effectiveResult.rows.length > PREVIEW_ROW_LIMIT ? (
              <p className="mt-2 text-xs font-medium text-slate-500">Showing first {PREVIEW_ROW_LIMIT} of {effectiveResult.rows.length} rows.</p>
            ) : null}
          </>
        ) : null}

        {hasRows ? (
          <>
            {/* Primary teacher path: download the finished document. */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <FileText size={17} aria-hidden="true" />
                {docxLabel}
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
              >
                <Download size={16} aria-hidden="true" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={handleEditInBuilder}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue xl:hidden"
              >
                <PencilLine size={16} aria-hidden="true" />
                Edit in Builder
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-semibold">{docxLabel}</span> gives you the finished document — ready to print or edit in Word.
            </p>

            {/* Advanced (collapsed): map this content onto the teacher's own Word template. */}
            {onUseInWorkspace ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((open) => !open)}
                  aria-expanded={showAdvanced}
                  className="focus-ring flex w-full items-center justify-between gap-2 rounded-md px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:text-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings2 size={14} aria-hidden="true" />
                    Advanced: use my own Word template
                  </span>
                  <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {showAdvanced ? (
                  <div className="border-t border-slate-200 px-3.5 py-3">
                    <p className="text-xs leading-5 text-slate-500">
                      Only use this if you want to map this content into your own Word template. Most teachers can just download the DOCX above.
                    </p>
                    <button
                      type="button"
                      onClick={handleContinueToLayout}
                      disabled={using}
                      className="focus-ring mt-2.5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                    >
                      {using ? 'Loading…' : 'Advanced: use my own Word template'}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
        </>
        )}
      </div>
    </section>
  )
}
