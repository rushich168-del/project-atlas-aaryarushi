import { buildWorksheetModel } from '../composer/worksheetComposer.js'
import { buildQuestionPaperModel } from '../composer/questionPaperComposer.js'

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

function PaperShell({ children }) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-100 p-3 sm:p-5">
      <div className="mx-auto max-w-[720px] rounded-sm bg-white px-6 py-7 shadow-md ring-1 ring-slate-200 sm:px-10 sm:py-9">
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

function SourceBadge({ source }) {
  if (!source) {
    return null
  }

  const label = source === 'question-bank' ? 'Bank' : 'Placeholder'
  const className = source === 'question-bank'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <span className={`ml-2 inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  )
}

function WorksheetPaper({ form, rows }) {
  const model = buildWorksheetModel(form, rows)
  const boxed = model.layoutStyle === 'boxed' || model.layoutStyle === 'exam'

  return (
    <PaperShell>
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

function QuestionPaperPaper({ form, rows, blueprint }) {
  const model = buildQuestionPaperModel(form, rows, blueprint)

  return (
    <PaperShell>
      <PaperHeader institution={model.institution} title={model.title} />
      <div className="my-3 border-b-2 border-slate-800" />
      <FieldRow>
        <Field label="Class" value={model.grade} />
        <Field label="Subject" value={model.subject} />
        {model.examType ? <Field label="Exam" value={model.examType} /> : null}
        <Field label="Time" value={model.duration} />
        <Field label="Total Marks" value={model.totalMarks === '' ? '' : String(model.totalMarks)} />
        <Field label="Date" value={model.date} />
      </FieldRow>

      {model.generalInstructions.length ? (
        <div className="mt-4 rounded-sm bg-slate-50 px-4 py-3">
          <p className="text-[13px] font-bold text-slate-900">General Instructions</p>
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
        <div key={section.name} className="mt-5">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-slate-900">{section.name}</p>
          <div className="mt-1 border-b border-slate-300" />
          <ol className="mt-2 list-none text-[13px] leading-8 text-slate-800">
            {section.questions.map((q) => (
              <li key={q.number} className="flex items-baseline justify-between gap-4">
                <span>
                  <span className="font-medium">{q.number}.</span> {q.text}
                  <SourceBadge source={q.source} />
                </span>
                {model.showMarks && q.marks ? (
                  <span className="shrink-0 font-semibold text-slate-500">[{q.marks}]</span>
                ) : null}
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
    </PaperShell>
  )
}

export default function PaperPreview({ builderType, form, rows, blueprint }) {
  if (builderType === 'question-paper') {
    return <QuestionPaperPaper form={form} rows={rows} blueprint={blueprint} />
  }
  return <WorksheetPaper form={form} rows={rows} />
}
