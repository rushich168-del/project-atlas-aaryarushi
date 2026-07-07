import { Info, Plus, Trash2 } from 'lucide-react'
import { BLANK_SIZES, EDITABLE_QUESTION_TYPE_OPTIONS, MCQ_LAYOUTS, MCQ_OPTION_KEYS } from './editablePaperModel.js'

const MCQ_LAYOUT_LABELS = { vertical: 'Vertical', horizontal: 'Horizontal' }
const BLANK_SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' }

// Project Atlas v2.96 — Editable Question Paper editor (presentational).
//
// Renders the editable model as the actual paper the teacher is preparing:
//   A. Paper details card (header fields)
//   B. General instruction points (add / edit / delete)
//   C. Section cards with inline question editing
//   D. Add section
// All state lives in the parent (BuilderWorkspace) via the on* callbacks; this
// component only draws it. No storage, no network — teacher text is edited as-is.

function TextField({ label, value, placeholder, onChange, full }) {
  return (
    <label className={`grid gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
      />
    </label>
  )
}

function PaperDetailsCard({ header, onHeaderChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-primary">Paper header</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">These appear at the top of the question paper.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField label="School / College name" value={header.institution} placeholder="e.g. Sunrise Public School" onChange={(value) => onHeaderChange('institution', value)} full />
        <TextField label="Paper title" value={header.title} placeholder="e.g. Unit Test 1" onChange={(value) => onHeaderChange('title', value)} full />
        <TextField label="Class / Grade" value={header.grade} placeholder="e.g. Class 6" onChange={(value) => onHeaderChange('grade', value)} />
        <TextField label="Subject" value={header.subject} placeholder="e.g. Mathematics" onChange={(value) => onHeaderChange('subject', value)} />
        <TextField label="Exam type" value={header.examType} placeholder="e.g. Unit Test" onChange={(value) => onHeaderChange('examType', value)} />
        <TextField label="Duration" value={header.duration} placeholder="e.g. 1 hour" onChange={(value) => onHeaderChange('duration', value)} />
        <TextField label="Date" value={header.date} placeholder="e.g. 06/07/2026" onChange={(value) => onHeaderChange('date', value)} />
      </div>
    </div>
  )
}

function InstructionsCard({ instructions, onAddInstruction, onUpdateInstruction, onRemoveInstruction }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-primary">General instructions</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Shown as numbered points below the paper header.</p>
      <div className="mt-3 grid gap-2">
        {instructions.length ? (
          instructions.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-400">{index + 1}.</span>
              <input
                type="text"
                value={line}
                placeholder="Instruction point…"
                onChange={(event) => onUpdateInstruction(index, event.target.value)}
                className="min-h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-primary outline-none focus:border-accentBlue"
              />
              <button
                type="button"
                onClick={() => onRemoveInstruction(index)}
                aria-label="Delete instruction"
                className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-center text-xs text-slate-500">
            No instruction points. Add one below.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onAddInstruction}
        className="focus-ring mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
      >
        <Plus size={14} aria-hidden="true" />
        Add instruction point
      </button>
    </div>
  )
}

function AnswerField({ value, onChange }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder="Answer (optional — used in the answer key)"
      onChange={(event) => onChange(event.target.value)}
      className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-accentBlue"
    />
  )
}

// v2.97 — the right editing space per question type. MCQ gets a stem + A–D options
// and a layout toggle; Fill in the blanks gets before / size / after; True/False
// gets a statement + hint; everything else keeps a plain text box.
function QuestionFields({ sectionType, sectionId, question, showAnswerField, onQuestionChange, onQuestionOptionChange }) {
  const changeText = (field) => (event) => onQuestionChange(sectionId, question.id, field, event.target.value)

  if (sectionType === 'MCQ') {
    return (
      <>
        <textarea
          value={question.text}
          rows={2}
          placeholder="Type the MCQ question…"
          onChange={changeText('text')}
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-primary outline-none focus:border-accentBlue"
        />
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {MCQ_OPTION_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-sm font-semibold text-slate-500">{key}.</span>
              <input
                type="text"
                value={question.options?.[key] ?? ''}
                placeholder={`Option ${key}`}
                onChange={(event) => onQuestionOptionChange(sectionId, question.id, key, event.target.value)}
                className="min-h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-primary outline-none focus:border-accentBlue"
              />
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Options layout</span>
          <div className="inline-flex gap-1.5">
            {MCQ_LAYOUTS.map((layout) => {
              const active = (question.mcqLayout || 'vertical') === layout
              return (
                <button
                  key={layout}
                  type="button"
                  onClick={() => onQuestionChange(sectionId, question.id, 'mcqLayout', layout)}
                  className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-2.5 text-xs font-semibold transition ${
                    active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                  }`}
                >
                  {MCQ_LAYOUT_LABELS[layout]}
                </button>
              )
            })}
          </div>
        </div>
        {showAnswerField ? <AnswerField value={question.answer} onChange={(v) => onQuestionChange(sectionId, question.id, 'answer', v)} /> : null}
      </>
    )
  }

  if (sectionType === 'Fill in the blanks') {
    return (
      <>
        <input
          type="text"
          value={question.blankBefore}
          placeholder="Text before the blank"
          onChange={changeText('blankBefore')}
          className="min-h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-primary outline-none focus:border-accentBlue"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Blank size</span>
          <div className="inline-flex gap-1.5">
            {BLANK_SIZES.map((size) => {
              const active = (question.blankSize || 'medium') === size
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onQuestionChange(sectionId, question.id, 'blankSize', size)}
                  className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-2.5 text-xs font-semibold transition ${
                    active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                  }`}
                >
                  {BLANK_SIZE_LABELS[size]}
                </button>
              )
            })}
          </div>
        </div>
        <input
          type="text"
          value={question.blankAfter}
          placeholder="Text after the blank"
          onChange={changeText('blankAfter')}
          className="mt-2 min-h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-primary outline-none focus:border-accentBlue"
        />
        {showAnswerField ? <AnswerField value={question.answer} onChange={(v) => onQuestionChange(sectionId, question.id, 'answer', v)} /> : null}
      </>
    )
  }

  if (sectionType === 'True/False') {
    return (
      <>
        <textarea
          value={question.text}
          rows={2}
          placeholder="Type the statement…"
          onChange={changeText('text')}
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-primary outline-none focus:border-accentBlue"
        />
        <p className="mt-1 text-[11px] font-medium text-slate-400">Preview shows “True / False” below the statement.</p>
        {showAnswerField ? <AnswerField value={question.answer} onChange={(v) => onQuestionChange(sectionId, question.id, 'answer', v)} /> : null}
      </>
    )
  }

  return (
    <>
      <textarea
        value={question.text}
        rows={2}
        placeholder="Type the question text…"
        onChange={changeText('text')}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-primary outline-none focus:border-accentBlue"
      />
      {showAnswerField ? <AnswerField value={question.answer} onChange={(v) => onQuestionChange(sectionId, question.id, 'answer', v)} /> : null}
    </>
  )
}

function SectionCard({
  section,
  index,
  canRemove,
  showAnswerField,
  onSectionChange,
  onQuestionChange,
  onQuestionOptionChange,
  onAddQuestion,
  onDeleteQuestion,
  onRemoveSection,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Section {index + 1}</p>
        {canRemove ? (
          <button
            type="button"
            onClick={() => onRemoveSection(section.id)}
            className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
          >
            <Trash2 size={13} aria-hidden="true" />
            Remove section
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField label="Section title" value={section.title} placeholder="e.g. Section A" onChange={(value) => onSectionChange(section.id, 'title', value)} />
        <TextField label="Instruction" value={section.instruction} placeholder="e.g. Answer all questions." onChange={(value) => onSectionChange(section.id, 'instruction', value)} />
        <label className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Question type</span>
          <select
            value={section.questionType}
            onChange={(event) => onSectionChange(section.id, 'questionType', event.target.value)}
            className="min-h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
          >
            {EDITABLE_QUESTION_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Marks per question</span>
          <input
            type="number"
            min={1}
            value={section.marksPerQuestion ?? ''}
            onChange={(event) => onSectionChange(section.id, 'marksPerQuestion', event.target.value)}
            className="min-h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2">
        {section.questions.length ? (
          section.questions.map((question, questionIndex) => (
            <div key={question.id} className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5">
              <div className="flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-slate-400">{questionIndex + 1}.</span>
                <div className="min-w-0 flex-1">
                  <QuestionFields
                    sectionType={section.questionType}
                    sectionId={section.id}
                    question={question}
                    showAnswerField={showAnswerField}
                    onQuestionChange={onQuestionChange}
                    onQuestionOptionChange={onQuestionOptionChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(section.id, question.id)}
                  aria-label="Delete question"
                  className="focus-ring mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
            No questions in this section yet. Add one below.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onAddQuestion(section.id)}
        className="focus-ring mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
      >
        <Plus size={14} aria-hidden="true" />
        Add question
      </button>
    </div>
  )
}

export default function EditableQuestionPaper({
  model,
  notice,
  showAnswerField = false,
  onHeaderChange,
  onAddInstruction,
  onUpdateInstruction,
  onRemoveInstruction,
  onSectionChange,
  onQuestionChange,
  onQuestionOptionChange,
  onAddQuestion,
  onDeleteQuestion,
  onAddSection,
  onRemoveSection,
}) {
  if (!model) {
    return null
  }

  return (
    <div className="grid gap-4">
      {notice ? (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
          <Info size={15} className="mt-0.5 shrink-0 text-accentBlue" aria-hidden="true" />
          <p className="text-xs leading-5 text-blue-800">{notice}</p>
        </div>
      ) : null}

      <PaperDetailsCard header={model.header} onHeaderChange={onHeaderChange} />

      <InstructionsCard
        instructions={model.instructions || []}
        onAddInstruction={onAddInstruction}
        onUpdateInstruction={onUpdateInstruction}
        onRemoveInstruction={onRemoveInstruction}
      />

      {model.sections.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          index={index}
          canRemove={model.sections.length > 1}
          showAnswerField={showAnswerField}
          onSectionChange={onSectionChange}
          onQuestionChange={onQuestionChange}
          onQuestionOptionChange={onQuestionOptionChange}
          onAddQuestion={onAddQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onRemoveSection={onRemoveSection}
        />
      ))}

      <button
        type="button"
        onClick={onAddSection}
        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-dashed border-accentTeal bg-teal-50/50 px-4 text-sm font-semibold text-accentTeal transition hover:bg-teal-50"
      >
        <Plus size={16} aria-hidden="true" />
        Add section
      </button>
    </div>
  )
}
