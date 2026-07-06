import { buildWorksheetModel } from '../composer/worksheetComposer.js'
import { buildQuestionPaperModel } from '../composer/questionPaperComposer.js'

// Paper-style (A4-ish) preview of the composed worksheet / question paper. Reads
// the SAME model builders the DOCX composer uses, so on-screen preview and the
// downloaded .docx stay in sync. Presentational only.

function DetailLine({ label, value }) {
  return (
    <p className="text-[13px] leading-6 text-slate-800">
      <span className="font-semibold">{label}:</span>{' '}
      {value ? value : <span className="inline-block min-w-[120px] border-b border-dotted border-slate-400 align-baseline">&nbsp;</span>}
    </p>
  )
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

function WorksheetPaper({ form, rows }) {
  const model = buildWorksheetModel(form, rows)
  const boxed = model.layoutStyle === 'boxed' || model.layoutStyle === 'exam'

  return (
    <PaperShell>
      <div className={boxed ? 'border border-slate-300 p-4' : ''}>
        {model.institution ? (
          <h2 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">{model.institution}</h2>
        ) : null}
        <h3 className="mt-1 text-center text-base font-bold text-slate-900">{model.title}</h3>
        <div className="mt-2 border-b border-slate-300" />
        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
          <DetailLine label="Class" value={model.grade} />
          <DetailLine label="Section" value={model.section} />
          <DetailLine label="Name" value={model.studentName} />
          <DetailLine label="Roll No" value={model.rollNo} />
          <DetailLine label="Subject" value={model.subject} />
          {model.chapter ? <DetailLine label="Chapter" value={model.chapter} /> : null}
          {model.topic ? <DetailLine label="Topic" value={model.topic} /> : null}
          <DetailLine label="Date" value={model.date} />
        </div>
      </div>

      {model.instructions ? (
        <p className="mt-4 text-[13px] leading-6 text-slate-800">
          <span className="font-semibold">Instructions:</span> {model.instructions}
        </p>
      ) : null}

      <p className="mt-4 text-sm font-bold text-slate-900">Questions</p>
      <ol
        className={`mt-2 list-none text-[13px] leading-7 text-slate-800 ${model.questionLayout === 'two' ? 'sm:columns-2 sm:gap-8' : ''}`}
      >
        {model.questions.map((q) => (
          <li key={q.number} className="break-inside-avoid">
            {q.number}. {q.text}
            {model.answerSpace === 'working' ? <span className="my-1 block h-6 border-b border-dotted border-slate-300" /> : null}
          </li>
        ))}
      </ol>

      {model.showAnswerKey ? (
        <div className="mt-5 border-t border-slate-300 pt-3">
          <p className="text-sm font-bold text-slate-900">Answer Key</p>
          <ol className="mt-2 list-none text-[13px] leading-6 text-slate-700 sm:columns-2">
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
      {model.institution ? (
        <h2 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">{model.institution}</h2>
      ) : null}
      <h3 className="mt-1 text-center text-base font-bold text-slate-900">{model.title}</h3>
      <div className="mt-2 border-b border-slate-300" />
      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
        <DetailLine label="Class" value={model.grade} />
        <DetailLine label="Subject" value={model.subject} />
        {model.examType ? <DetailLine label="Exam Type" value={model.examType} /> : null}
        <DetailLine label="Time" value={model.duration} />
        <DetailLine label="Total Marks" value={model.totalMarks === '' ? '' : String(model.totalMarks)} />
        <DetailLine label="Date" value={model.date} />
      </div>

      {model.generalInstructions.length ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-900">General Instructions</p>
          <ol className="mt-1 list-decimal pl-5 text-[13px] leading-6 text-slate-800">
            {model.generalInstructions.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {model.sections.map((section) => (
        <div key={section.name} className="mt-5">
          <p className="border-b border-slate-300 pb-1 text-sm font-bold text-slate-900">{section.name}</p>
          <ol className="mt-2 list-none text-[13px] leading-7 text-slate-800">
            {section.questions.map((q) => (
              <li key={q.number}>
                {q.number}. {q.text}
                {model.showMarks && q.marks ? <span className="font-semibold text-slate-500"> ({q.marks} marks)</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ))}

      {model.showAnswerKey ? (
        <div className="mt-5 border-t border-slate-300 pt-3">
          <p className="text-sm font-bold text-slate-900">Answer Key</p>
          {model.sections.map((section) => (
            <div key={section.name} className="mt-2">
              <p className="text-[13px] font-semibold text-slate-700">{section.name}</p>
              <ol className="list-none text-[13px] leading-6 text-slate-700">
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
