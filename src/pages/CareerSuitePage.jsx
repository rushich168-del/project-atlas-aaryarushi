import { useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { CareerSuiteHeader } from '../features/career-suite/components/CareerSuiteHeader.jsx'
import { CareerSuiteTabs } from '../features/career-suite/components/CareerSuiteTabs.jsx'
import { OverviewTab } from '../features/career-suite/components/OverviewTab.jsx'
import { CareerProfileTab } from '../features/career-suite/components/CareerProfileTab.jsx'
import { ResumeApplicationsTab } from '../features/career-suite/components/ResumeApplicationsTab.jsx'
import { JobsOpportunitiesTab } from '../features/career-suite/components/JobsOpportunitiesTab.jsx'
import { SkillsInterviewTab } from '../features/career-suite/components/SkillsInterviewTab.jsx'
import { CareerPortfolioTab } from '../features/career-suite/components/CareerPortfolioTab.jsx'

export default function CareerSuitePage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <DashboardLayout title="Career Suite" eyebrow="Unified Workspace" currentView="career-suite">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header with Navigation Tabs */}
        <CareerSuiteHeader>
          <CareerSuiteTabs activeTab={activeTab} onSelectTab={setActiveTab} />
        </CareerSuiteHeader>

        {/* Tab Content Areas */}
        <div className="mt-6">
          {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
          {activeTab === 'profile' && <CareerProfileTab />}
          {activeTab === 'resume' && <ResumeApplicationsTab />}
          {activeTab === 'jobs' && <JobsOpportunitiesTab />}
          {activeTab === 'skills' && <SkillsInterviewTab />}
          {activeTab === 'portfolio' && <CareerPortfolioTab />}
        </div>
      </div>
    </DashboardLayout>
  )
}
