import { Construction, FileClock } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'

const moduleCopy = {
  templates: {
    title: 'Templates',
    eyebrow: 'Coming soon',
    description: 'A reusable template library is planned after the MVP launch. For now, upload the AR-CERT-PRO template inside the product workspace.',
  },
  uploads: {
    title: 'Uploads',
    eyebrow: 'Coming soon',
    description: 'A workspace-wide upload library is planned after the MVP launch. AR-CERT-PRO uploads are handled directly in the product workflow.',
  },
  settings: {
    title: 'Settings',
    eyebrow: 'Coming soon',
    description: 'Workspace settings, branding, and integrations will be added after the MVP launch.',
  },
}

export default function ModulePlaceholderPage({ moduleId }) {
  const module = moduleCopy[moduleId] || moduleCopy.templates

  return (
    <DashboardLayout title={module.title} eyebrow={module.eyebrow} currentView={moduleId}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex max-w-3xl flex-col gap-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
              <Construction size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-primary">{module.title} coming soon</h2>
              <p className="mt-3 leading-7 text-slate-600">{module.description}</p>
            </div>
            <div className="rounded-md border border-dashed border-slate-300 bg-lightBg p-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <FileClock size={18} className="text-accentTeal" aria-hidden="true" />
                This area is intentionally reserved while the MVP focuses on single DOCX generation and History.
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
