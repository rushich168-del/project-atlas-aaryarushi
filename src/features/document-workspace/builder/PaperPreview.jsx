import { buildWorksheetModel } from '../composer/worksheetComposer.js'
import { buildQuestionPaperModel } from '../composer/questionPaperComposer.js'
import { useEffect, useRef } from 'react'

// Paper-style (A4-ish) preview of the composed worksheet / question paper. Reads
// the SAME model builders the DOCX composer uses, so on-screen preview and the
// downloaded .docx stay in sync. Presentational only.

// One inline "Label: value" cell. Empty values render a dotted fill-in line so a
// printed sheet has a blank to write on.
function Field({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[13px] leading-6 text-slate-800">
      <span className="font-semibold">{label}:</span>
      {value ? (
        <span>{value}</span>
      ) : (
        <span className="inline-block min-w-[90px] border-b border-dotted border-slate-400">&nbsp;</span>
      )}
    </span>
  )
}

// A row of fields separated by clean spacing; wraps on narrow screens.
function FieldRow({ children }) {
  return <div className="flex flex-wrap gap-x-6 gap-y-1">{children}</div>
}

function PaperShell({ children, compact = false, scrollStorageKey = '' }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!scrollStorageKey || typeof window === 'undefined') {
      return undefined
    }
    const node = scrollRef.current
    if (!node) {
      return undefined
    }
    try {
      const saved = window.localStorage.getItem(scrollStorageKey)
      if (saved) {
        window.requestAnimationFrame(() => {
          node.scrollTop = Number(saved) || 0
        })
      }
    } catch {
      // Storage is best-effort only.
    }
    const handleScroll = () => {
      try {
        window.localStorage.setItem(scrollStorageKey, String(node.scrollTop))
      } catch {
        // Storage is best-effort only.
      }
    }
    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => node.removeEventListener('scroll', handleScroll)
  }, [scrollStorageKey])

  return (
    <div ref={scrollRef} className="mt-3 max-h-[82vh] overflow-y-auto rounded-md border border-slate-200 bg-slate-100 p-3 sm:p-5">
      <div
        className={`mx-auto min-h-[min(1123px,145vw)] w-full max-w-[794px] rounded-sm bg-white shadow-md ring-1 ring-slate-200 ${
          compact ? 'px-5 py-6 sm:px-10 sm:py-8' : 'px-6 py-8 sm:px-12 sm:py-12'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function PaperHeader({ institution, title }) {
  return (
    <header className="text-center">
      {institution ? (
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{institution}</h2>
      ) : null}
      <h3 className={`text-base font-bold text-slate-900 ${institution ? 'mt-0.5' : ''}`}>{title}</h3>
    </header>
  )
}

const SOURCE_BADGES = {
  'question-bank': { label: 'Bank', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  'teacher-material': { label: 'Your question', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  'reference-topic': { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  placeholder: { label: 'Placeholder', className: 'border-amber-200 bg-amber-50 text-amber-700' },
}

function SourceBadge({ source }) {
  if (!source) {
    return null
  }

  const badge = SOURCE_BADGES[source] || SOURCE_BADGES.placeholder

  return (
    <span className={`ml-2 inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>
      {badge.label}
    </span>
  )
}

function WorksheetPaper({ form, rows, scrollStorageKey }) {
  const model = buildWorksheetModel(form, rows)
  const boxed = model.layoutStyle === 'boxed' || model.layoutStyle === 'exam'

  return (
    <PaperShell scrollStorageKey={scrollStorageKey}>
      <div className={boxed ? 'border border-slate-300 p-4' : ''}>
        <PaperHeader institution={model.institution} title={model.title} />
        <div className="my-3 border-b-2 border-slate-800" />
        <div className="space-y-1.5">
          <FieldRow>
            <Field label="Class" value={model.grade} />
            <Field label="Section" value={model.section} />
            <Field label="Name" value={model.studentName} />
            <Field label="Roll No" value={model.rollNo} />
          </FieldRow>
          <FieldRow>
            <Field label="Subject" value={model.subject} />
            {model.chapter ? <Field label="Chapter" value={model.chapter} /> : null}
            {model.topic ? <Field label="Topic" value={model.topic} /> : null}
            <Field label="Date" value={model.date} />
          </FieldRow>
        </div>
      </div>

      {model.instructions ? (
        <p className="mt-4 text-[13px] leading-6 text-slate-800">
          <span className="font-semibold">Instructions:</span> {model.instructions}
        </p>
      ) : null}

      <p className="mt-5 text-sm font-bold text-slate-900">Questions</p>
      <ol
        className={`mt-2 list-none text-[13px] text-slate-800 ${
          model.questionLayout === 'two' ? 'sm:columns-2 sm:gap-10' : ''
        } ${model.answerSpace === 'working' ? 'leading-6' : 'leading-8'}`}
      >
        {model.questions.map((q) => (
          <li key={q.number} className="mb-1 break-inside-avoid">
            <span className="font-medium">{q.number}.</span> {q.text}
            {model.answerSpace === 'working' ? (
              <span className="mb-3 mt-2 block h-8 border-b border-dashed border-slate-300" />
            ) : null}
          </li>
        ))}
      </ol>

      {model.showAnswerKey ? (
        <div className="mt-6 border-t-2 border-slate-300 pt-3">
          <p className="text-sm font-bold text-slate-900">
            Answer Key
            {model.answerKeyLocation === 'newpage' ? (
              <span className="ml-2 text-[11px] font-medium text-slate-400">· prints on a new page</span>
            ) : null}
          </p>
          <ol className="mt-2 list-none text-[13px] leading-6 text-slate-600 sm:columns-2 sm:gap-10">
            {model.questions.map((q) => (
              <li key={q.number} className="break-inside-avoid">{q.number}. {q.answer || '—'}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </PaperShell>
  )
}

// v2.97 — preview-only style presets, made clearly distinct. DOCX is unaffected.
const QUESTION_PAPER_STYLES = {
  classic: {
    font: '',
    compact: false,
    headerRule: 'my-3 border-b-2 border-slate-800',
    sectionGap: 'mt-5',
    questionText: 'text-[13px] leading-8',
    optionText: 'text-[13px]',
    sectionTitle: 'text-center text-sm font-bold uppercase tracking-wide text-slate-900',
  },
  compact: {
    font: '',
    compact: true,
    headerRule: 'my-2 border-b border-slate-700',
    sectionGap: 'mt-3',
    questionText: 'text-[12px] leading-5',
    optionText: 'text-[12px]',
    sectionTitle: 'text-center text-[13px] font-bold uppercase tracking-wide text-slate-900',
  },
  formal: {
    font: 'font-serif',
    compact: false,
    headerRule: 'my-3 border-b-4 border-double border-slate-800',
    sectionGap: 'mt-7',
    questionText: 'text-[13px] leading-9',
    optionText: 'text-[13px]',
    sectionTitle: 'text-center text-sm font-bold uppercase tracking-[0.25em] text-slate-900',
  },
}

// Render a typed question's body from its structured payload; falls back to the
// composed text when no structured data is present.
function QuestionBody({ question, optionText }) {
  const structured = question.structured
  if (!structured) {
    return <span>{question.text}</span>
  }
  if (structured.type === 'mcq') {
    return (
      <>
        {structured.stem ? <span>{structured.stem}</span> : null}
        <div
          className={
            structured.layout === 'horizontal'
              ? `mt-1 flex flex-wrap gap-x-8 gap-y-1 ${optionText}`
              : `mt-1 grid gap-0.5 ${optionText}`
          }
        >
          {structured.options.map((option) => (
            <span key={option.key} className="text-slate-800">
              <span className="font-medium">({option.key})</span> {option.value}
            </span>
          ))}
        </div>
      </>
    )
  }
  if (structured.type === 'blank') {
    return (
      <span>
        {structured.before ? `${structured.before} ` : ''}
        <span className="inline-block border-b border-slate-500 align-baseline" style={{ width: `${structured.width || 12}ch` }}>&nbsp;</span>
        {structured.after ? ` ${structured.after}` : ''}
      </span>
    )
  }
  if (structured.type === 'truefalse') {
    return (
      <>
        {structured.statement ? <span>{structured.statement}</span> : null}
        <span className="mt-0.5 block text-[12px] font-semibold uppercase tracking-wide text-slate-500">True / False</span>
      </>
    )
  }
  return <span>{question.text}</span>
}

function QuestionPaperPaper({ form, rows, blueprint, previewStyle = 'classic', scrollStorageKey }) {
  const model = buildQuestionPaperModel(form, rows, blueprint)
  const style = QUESTION_PAPER_STYLES[previewStyle] || QUESTION_PAPER_STYLES.classic
  const formal = previewStyle === 'formal'

  return (
    <PaperShell compact={style.compact} scrollStorageKey={scrollStorageKey}>
     <div className={style.font}>
      <div className={formal ? 'text-center' : ''}>
        <PaperHeader institution={model.institution} title={model.title} />
        {formal && model.subject ? (
          <p className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-slate-500">{model.subject}</p>
        ) : null}
      </div>
      <div className={style.headerRule} />
      <FieldRow>
        <Field label="Class" value={model.grade} />
        <Field label="Subject" value={model.subject} />
        {model.examType ? <Field label="Exam" value={model.examType} /> : null}
        <Field label="Time" value={model.duration} />
        <Field label="Total Marks" value={model.totalMarks === '' ? '' : String(model.totalMarks)} />
        <Field label="Date" value={model.date} />
      </FieldRow>

      {model.generalInstructions.length ? (
        <div className={`mt-4 rounded-sm px-4 py-3 ${formal ? 'border border-slate-300 bg-white' : 'bg-slate-50'}`}>
          <p className={`text-[13px] font-bold text-slate-900 ${formal ? 'text-center uppercase tracking-wide' : ''}`}>General Instructions</p>
          <ol className="mt-1 list-decimal pl-5 text-[13px] leading-6 text-slate-800">
            {model.generalInstructions.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {model.sectionLayout === 'newpage' ? (
        <p className="mt-3 text-[11px] font-medium text-slate-400">Each section starts on a new page in the DOCX.</p>
      ) : null}

      {model.sections.map((section) => (
        <div key={section.name} className={style.sectionGap}>
          <p className={style.sectionTitle}>{section.name}</p>
          {section.questionType ? (
            <p className="mt-0.5 text-center text-[11px] font-semibold text-slate-500">{section.questionType}</p>
          ) : null}
          {section.instruction ? (
            <p className="mt-1 text-[12px] italic leading-5 text-slate-600">{section.instruction}</p>
          ) : null}
          <div className="mt-1 border-b border-slate-300" />
          <ol className={`mt-2 list-none text-slate-800 ${style.questionText}`}>
            {section.questions.map((q) => (
              <li key={q.number} className="mb-1">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-medium">{q.number}.</span>{' '}
                    <QuestionBody question={q} optionText={style.optionText} />
                    <SourceBadge source={q.source} />
                  </div>
                  {model.showMarks && q.marks ? (
                    <span className="shrink-0 font-semibold text-slate-500">[{q.marks}]</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {model.showAnswerKey ? (
        <div className="mt-6 border-t-2 border-slate-300 pt-3">
          <p className="text-sm font-bold text-slate-900">
            Answer Key
            <span className="ml-2 text-[11px] font-medium text-slate-400">· prints on a new page</span>
          </p>
          {model.sections.map((section) => (
            <div key={section.name} className="mt-2">
              <p className="text-[13px] font-semibold text-slate-700">{section.name}</p>
              <ol className="list-none text-[13px] leading-6 text-slate-600">
                {section.questions.map((q) => (
                  <li key={q.number}>{q.number}. {q.answer || '[Answer key placeholder]'}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : null}
     </div>
    </PaperShell>
  )
}

export default function PaperPreview({ builderType, form, rows, blueprint, previewStyle, scrollStorageKey }) {
  if (builderType === 'question-paper') {
    return <QuestionPaperPaper form={form} rows={rows} blueprint={blueprint} previewStyle={previewStyle} scrollStorageKey={scrollStorageKey} />
  }
  return <WorksheetPaper form={form} rows={rows} scrollStorageKey={scrollStorageKey} />
}
