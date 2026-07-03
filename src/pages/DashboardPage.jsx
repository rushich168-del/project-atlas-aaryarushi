import { useEffect, useMemo, useState } from 'react'
import { Activity, Boxes, CheckCircle2, Clock3, Layers3 } from 'lucide-react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import SuiteProductCard from '../components/dashboard/SuiteProductCard.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { getGeneratedDocumentsHistory, getGenerationJobsHistory } from '../services/generatedDocumentsService.js'
import { navigateTo } from '../utils/routes.js'

export default function DashboardPage() {
  const { organization, categories, products, source, status, loading, error } = useProductCatalog()
  const [hasRecentWork, setHasRecentWork] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchRecentWork() {
      if (!organization?.id) {
        setHasRecentWork(false)
        return
      }

      try {
        const [documentsResult, jobsResult] = await Promise.all([
          getGeneratedDocumentsHistory(organization.id, 1),
          getGenerationJobsHistory(organization.id, 1),
        ])

        if (!active) {
          return
        }

        setHasRecentWork(
          (documentsResult.documents?.length || 0) + (jobsResult.jobs?.length || 0) > 0,
        )
      } catch {
        if (active) {
          setHasRecentWork(false)
        }
      }
    }

    fetchRecentWork()

    return () => {
      active = false
    }
  }, [organization?.id])
  const stats = useMemo(
    () => [
      { label: 'Total products', value: products.length, detail: 'Across education, HR, and office automation.', icon: Boxes },
      { label: 'Ready to demo', value: products.filter((product) => product.status === 'Ready').length, detail: 'Products marked ready for client conversations.', icon: CheckCircle2, tone: 'teal' },
      { label: 'In progress', value: products.filter((product) => product.status === 'In progress').length, detail: 'Products with defined direction but active polish pending.', icon: Clock3, tone: 'amber' },
      { label: 'Categories', value: categories.length, detail: 'Primary business segments for catalog planning.', icon: Activity },
    ],
    [categories.length, products],
  )

  const suiteProducts = [
    {
      label: 'Certificate Engine',
      productCode: 'AR-CERT-PRO',
      summary: 'Generate personalized certificates from DOCX templates and Excel data.',
      suiteLabel: 'Education Suite',
      status: 'Active',
      badge: 'Live',
      active: true,
      href: '/dashboard/products/ar-cert-pro/workspace',
      buttonLabel: 'Open Workspace',
    },
    {
      label: 'Worksheet Engine',
      productCode: 'AR-WORKSHEET-PRO',
      summary: 'Spreadsheet-based worksheets for classroom distribution and grading.',
      suiteLabel: 'Education Suite',
      status: 'Coming Soon',
      badge: 'Planned',
      active: false,
    },
    {
      label: 'Question Paper Engine',
      productCode: 'AR-QUESTION-PRO',
      summary: 'Design question papers from reusable banks and templates.',
      suiteLabel: 'Education Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Report Engine',
      productCode: 'AR-REPORT-PRO',
      summary: 'Generate summary reports and business templates from Excel.',
      suiteLabel: 'Education Suite',
      status: 'Desktop Ready',
      badge: 'Desktop Ready',
      active: false,
    },
    {
      label: 'Marksheet Engine',
      productCode: 'AR-MARKSHEET-PRO',
      summary: 'Create student marksheets automatically from exam results.',
      suiteLabel: 'Education Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'ID Card Engine',
      productCode: 'AR-IDCARD-PRO',
      summary: 'Build ID cards with data from Excel and approved layouts.',
      suiteLabel: 'Education Suite',
      status: 'Desktop Ready',
      badge: 'Desktop Ready',
      active: false,
    },
    {
      label: 'Offer Letter Engine',
      productCode: 'AR-OFFER-PRO',
      summary: 'Offer letters generated from HR data and standard templates.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Payslip Engine',
      productCode: 'AR-PAYSLIP-PRO',
      summary: 'Payroll slips generated from employee and salary data.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Employee ID Engine',
      productCode: 'AR-EMP-ID-PRO',
      summary: 'Employee IDs created from staff details and photo mappings.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Experience Letter Engine',
      productCode: 'AR-EXPERIENCE-PRO',
      summary: 'Generate experience letters for employees with standard formatting.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'HR Mail Engine',
      productCode: 'AR-HRMAIL-PRO',
      summary: 'Batch mail templates for HR communication and announcements.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Invoice Engine',
      productCode: 'AR-INVOICE-PRO',
      summary: 'Invoice generation from spreadsheet line items for small business.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Quotation Engine',
      productCode: 'AR-QUOTATION-PRO',
      summary: 'Quotation templates generated from estimate details.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Purchase Order Engine',
      productCode: 'AR-PO-PRO',
      summary: 'Purchase order creation from buyer, vendor, and item data.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Receipt Engine',
      productCode: 'AR-RECEIPT-PRO',
      summary: 'Receipt generation for payment records and client acknowledgements.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Business Mail Engine',
      productCode: 'AR-BUSINESSMAIL-PRO',
      summary: 'Business communication templates and mail merge workflows.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
  ]

  return (
    <DashboardLayout title="Product Dashboard" eyebrow="Project Atlas MVP" currentView="dashboard" workspaceStatus={status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accentTeal">Welcome to Project Atlas</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">Choose an automation product and continue your latest generation workflow.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                This dashboard keeps your SaaS workflow clean and ready for demos. Continue AR-CERT-PRO, start a new generation, or review History from one place.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-lightBg p-4">
              <Layers3 className="text-accentBlue" size={22} aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-500">Current release</p>
              <p className="mt-1 text-lg font-semibold text-primary">Project Atlas v2.0 batch DOCX generation</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-3 text-lg font-semibold text-primary">Open Certificate Engine</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Resume the AR-CERT-PRO workspace and continue the existing certificate generation workflow.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
              className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open AR-CERT-PRO
            </button>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-3 text-lg font-semibold text-primary">View Generation History</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">See previously generated DOCX files and re-download from History.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/history')}
              className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
            >
              Open History
            </button>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-3 text-lg font-semibold text-primary">Upload Template</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Start a new batch by uploading your certificate template file in AR-CERT-PRO.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
              className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Upload Template
            </button>
          </div>
          {hasRecentWork ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
              <p className="mt-3 text-lg font-semibold text-primary">Continue Recent Work</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Resume your most recent Certificate Engine workflow from the workspace.</p>
              <button
                type="button"
                onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
                className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue work
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {[
            {
              title: 'Education Suite',
              description: 'Documents for schools, colleges, training institutes, and academic teams.',
              products: suiteProducts.filter((card) => card.suiteLabel === 'Education Suite'),
            },
            {
              title: 'HR Suite',
              description: 'Offer letters, payslips, IDs, experience letters, and HR mail workflows.',
              products: suiteProducts.filter((card) => card.suiteLabel === 'HR Suite'),
            },
            {
              title: 'Office / Business Suite',
              description: 'Invoices, quotations, purchase orders, receipts, and business mail.',
              products: suiteProducts.filter((card) => card.suiteLabel === 'Office / Business Suite'),
            },
          ].map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{section.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  {section.products.length} products
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.products.map((card) => (
                  <SuiteProductCard key={card.productCode} card={card} />
                ))}
              </div>
            </section>
          ))}
        </section>
      </div>
    </DashboardLayout>
  )
}
