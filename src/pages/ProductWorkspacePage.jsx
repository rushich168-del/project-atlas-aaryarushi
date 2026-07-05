import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, FileSpreadsheet, FileText, Info, Layers3, UploadCloud } from 'lucide-react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { getCategoryById } from '../data/products.js'
import { certificateWorkspaceConfig } from '../features/certificate/config.js'
import WorkspaceLayout from '../features/workspace-engine/WorkspaceLayout.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { navigateTo } from '../utils/routes.js'

const workspaceConfigs = {
  'ar-cert-pro': certificateWorkspaceConfig,
}

const productGuidance = {
  'ar-marksheet-pro': {
    template: 'Upload a marksheet Word template with placeholders for student details, subjects, marks, totals, and remarks.',
    excel: 'Prepare student marks Excel data with student identity columns and subject/score columns.',
    fields: ['StudentName', 'RollNumber', 'Class', 'Subject', 'Marks', 'Total', 'Grade', 'Remarks'],
    purpose: 'Prepare a marksheet workspace by checking the student marks data and the marksheet template structure before generation is connected.',
  },
  'ar-report-pro': {
    template: 'Upload a student report Word template with placeholders for progress, attendance, remarks, and academic details.',
    excel: 'Prepare student report Excel data with student details, marks, attendance, and teacher remarks.',
    fields: ['StudentName', 'Class', 'Attendance', 'Marks', 'Progress', 'TeacherRemarks', 'AcademicYear'],
    purpose: 'Prepare a report workspace by aligning student report data with the report template and preview expectations.',
  },
  'ar-worksheet-pro': {
    template: 'Upload a worksheet Word template with placeholders for topic, instructions, questions, and answer areas.',
    excel: 'Prepare worksheet content data with topics, question text, difficulty, and class/subject details.',
    fields: ['Topic', 'Class', 'Subject', 'Question', 'Instruction', 'Difficulty', 'AnswerKey'],
    purpose: 'Prepare a worksheet workspace by checking classroom worksheet content and template placeholders.',
  },
  'ar-question-pro': {
    template: 'Upload a question paper Word template with placeholders for sections, questions, marks, and exam details.',
    excel: 'Prepare question data with question text, section, marks, difficulty, and answer/reference fields.',
    fields: ['QuestionText', 'Section', 'Marks', 'Difficulty', 'QuestionType', 'AnswerHint'],
    purpose: 'Prepare a question paper workspace by matching question data to the question paper template layout.',
  },
  'ar-idcard-pro': {
    template: 'Upload an ID card Word template with placeholders for identity, class/department, and photo-related fields.',
    excel: 'Prepare student or staff details with ID numbers, names, class/department, and contact fields.',
    fields: ['FullName', 'IDNumber', 'Class', 'Department', 'ValidUntil', 'PhotoReference'],
    purpose: 'Prepare an ID card workspace by checking staff/student details and template placeholders. Photo automation is not treated as fully live here.',
  },
  'ar-invoice-pro': {
    template: 'Upload an invoice Word template with placeholders for client, invoice number, line items, amount, and dates.',
    excel: 'Prepare invoice data with client details, invoice rows, amounts, taxes if used, and invoice dates.',
    fields: ['InvoiceNumber', 'ClientName', 'InvoiceDate', 'Item', 'Quantity', 'Amount', 'Total'],
    purpose: 'Prepare an invoice workspace by checking spreadsheet columns and invoice template placeholders before generation is connected.',
  },
  'ar-fee-receipt-pro': {
    template: 'Upload a fee receipt Word template with placeholders for receipt number, student, amount, date, and authorization.',
    excel: 'Prepare fee receipt data with student details, fee amount, receipt date, class/course, and authorized-by fields.',
    fields: ['ReceiptNumber', 'StudentName', 'Class', 'Course', 'Amount', 'ReceiptDate', 'ReceiptMode', 'AuthorizedBy'],
    purpose: 'Prepare a fee receipt workspace by confirming receipt data and template placeholders before the dedicated workflow is connected.',
  },
  'ar-mail-pro': {
    template: 'Prepare subject and body template text with personalization placeholders such as {{Name}} or {{Course}}.',
    excel: 'Prepare recipient Excel data with recipient email and personalization columns.',
    fields: ['RecipientEmail', 'Name', 'SubjectData', 'PersonalMessage', 'AttachmentReference'],
    purpose: 'Prepare a mail workspace for dry-run validation only. Real row-recipient sending remains disabled.',
  },
}

const defaultGuidance = {
  template: 'Upload a Word template with clear placeholders for the values that should come from Excel.',
  excel: 'Prepare Excel data with one row per output and clear column names.',
  fields: ['Name', 'Date', 'ReferenceNumber', 'Description', 'Remarks'],
  purpose: 'Prepare this product workspace by matching template placeholders to spreadsheet columns before any generation workflow is connected.',
}

const progressSteps = ['Product selected', 'Template ready', 'Excel ready', 'Fields checked', 'Preview', 'Generate / Setup']

function GuidanceUploadBox({ icon: Icon, title, description, fileName, accept, onChange }) {
  return (
    <label className="block rounded-lg border border-dashed border-slate-300 bg-white p-5 shadow-sm transition hover:border-accentTeal hover:bg-teal-50/30">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <p className="mt-3 rounded-md border border-slate-200 bg-lightBg px-3 py-2 text-sm font-semibold text-slate-600">
            {fileName || 'No file selected yet. Choose a file to mark this setup item as ready.'}
          </p>
        </div>
      </div>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0]?.name || '')}
      />
    </label>
  )
}

function GuidedWorkspaceStarter({ product, category, catalogState }) {
  const [templateFileName, setTemplateFileName] = useState('')
  const [excelFileName, setExcelFileName] = useState('')
  const guidance = productGuidance[product.slug] || defaultGuidance
  const isMailProduct = product.slug === 'ar-mail-pro'
  const completedSteps = useMemo(() => new Set([
    'Product selected',
    ...(templateFileName ? ['Template ready'] : []),
    ...(excelFileName ? ['Excel ready'] : []),
    ...(templateFileName && excelFileName ? ['Fields checked', 'Preview'] : []),
  ]), [excelFileName, templateFileName])
  const suiteLabel = product.categoryId === 'education'
    ? 'Education Suite'
    : product.categoryId === 'office-business'
      ? 'Office / Business Suite'
      : 'HR / Admin Suite'

  return (
    <DashboardLayout title={`${product.name} Workspace`} eyebrow={category?.name || suiteLabel} showBack currentView="products" workspaceStatus={catalogState.status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner {...catalogState} />

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div>
              <p className="text-sm font-semibold text-accentTeal">{suiteLabel}</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">{product.name}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">{guidance.purpose}</p>
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-amber-800">
                    {isMailProduct
                      ? 'This workspace prepares and validates mail data only. Real row-recipient sending, controlled batch sending, failed-row resend, and Gmail/Outlook OAuth are not enabled.'
                      : 'This guided starter does not generate documents yet for this product. It helps prepare the template, Excel data, and field checklist safely before a dedicated workflow is connected.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-lightBg p-4">
              <p className="text-sm font-semibold text-primary">Workspace progress</p>
              <div className="mt-4 grid gap-2">
                {progressSteps.map((step, index) => {
                  const complete = completedSteps.has(step)
                  const current = !complete && (index === 1 && !templateFileName || index === 2 && templateFileName && !excelFileName || index === 3 && templateFileName && excelFileName)

                  return (
                    <div key={step} className={`flex items-center gap-3 rounded-md border p-3 ${complete ? 'border-teal-200 bg-teal-50' : current ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${complete ? 'bg-accentTeal text-white' : current ? 'bg-accentBlue text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {complete ? <CheckCircle2 size={15} aria-hidden="true" /> : index + 1}
                      </span>
                      <p className={`text-sm font-semibold ${complete ? 'text-teal-800' : current ? 'text-blue-800' : 'text-slate-500'}`}>{step}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <GuidanceUploadBox
            icon={FileText}
            title={isMailProduct ? 'Message template placeholder' : 'Template upload placeholder'}
            description={guidance.template}
            fileName={templateFileName}
            accept=".doc,.docx,.txt"
            onChange={setTemplateFileName}
          />
          <GuidanceUploadBox
            icon={FileSpreadsheet}
            title={isMailProduct ? 'Recipient data placeholder' : 'Excel upload placeholder'}
            description={guidance.excel}
            fileName={excelFileName}
            accept=".xls,.xlsx,.csv"
            onChange={setExcelFileName}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Layers3 className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Field and placeholder guidance</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep placeholder names in the Word template aligned with Excel column names. Use consistent spelling and avoid extra spaces so mapping is straightforward when the product workflow is connected.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {guidance.fields.map((field) => (
                <span key={field} className="rounded-md border border-slate-200 bg-lightBg px-3 py-2 text-sm font-semibold text-slate-700">
                  {field}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <UploadCloud className="text-accentTeal" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Next action</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {templateFileName && excelFileName
                ? 'Template and Excel placeholders are selected for this session. Continue by reviewing the product detail page or request setup with these requirements.'
                : 'Select a template and Excel file to clarify the setup requirements. Files are not uploaded or permanently stored from this starter.'}
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => navigateTo(`/dashboard/products/${product.slug}`)}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                {isMailProduct ? 'Review Mail Prep' : 'Prepare Workspace'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateFileName('')
                  setExcelFileName('')
                }}
                className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
              >
                Clear local selections
              </button>
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default function ProductWorkspacePage({ slug }) {
  const catalogState = useProductCatalog()
  const product = catalogState.products.find((item) => item.slug === slug)
  const config = workspaceConfigs[slug]
  const category = catalogState.categories.find((item) => item.id === product?.categoryId) || getCategoryById(product?.categoryId)

  if (catalogState.loading) {
    return (
      <DashboardLayout title="Loading workspace" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={catalogState.status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner {...catalogState} />
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout title="Workspace unavailable" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={catalogState.status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner {...catalogState} />
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-primary">This product workspace is not configured yet.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">AR-CERT-PRO is the first product wired into the generic workspace engine.</p>
            <button
              type="button"
              onClick={() => navigateTo(`/dashboard/products/${slug}`)}
              className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to product
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!config) {
    return <GuidedWorkspaceStarter product={product} category={category} catalogState={catalogState} />
  }

  return <WorkspaceLayout product={product} config={config} catalogState={catalogState} />
}
