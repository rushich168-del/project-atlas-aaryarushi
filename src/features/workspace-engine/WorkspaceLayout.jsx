import { useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import DataStateBanner from '../../components/dashboard/DataStateBanner.jsx'
import EnvironmentBanner from '../../components/dashboard/EnvironmentBanner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import ReadinessChecklist from './ReadinessChecklist.jsx'
import StepRenderer from './StepRenderer.jsx'
import WorkspaceFooter from './WorkspaceFooter.jsx'
import WorkspaceHeader from './WorkspaceHeader.jsx'
import WorkspaceStepper from './WorkspaceStepper.jsx'
import { useWorkspaceStatus } from './useWorkspaceStatus.js'
import { getFriendlyError } from '../../utils/errorMessages.js'

function getCompletedSteps(config, state) {
  return config.steps.reduce((completed, step) => {
    completed[step.id] = step.isComplete ? step.isComplete(state) : false
    return completed
  }, {})
}

export default function WorkspaceLayout({ product, config, catalogState }) {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [workspaceState, setWorkspaceState] = useState(config.createInitialState())
  const completedSteps = useMemo(() => getCompletedSteps(config, workspaceState), [config, workspaceState])
  const { readinessItems, readinessPercentage, canGenerate } = useWorkspaceStatus(config, workspaceState)
  const activeStepConfig = config.steps[activeStep]

  function updateState(update) {
    setWorkspaceState((current) => ({
      ...current,
      ...(typeof update === 'function' ? update(current) : update),
    }))
  }

  async function handleGenerate() {
    if (!canGenerate || workspaceState.generating) {
      return
    }

    if (config.generateDocument) {
      updateState({
        generating: true,
        generationComplete: false,
        generationError: '',
        outputError: '',
        persistingOutput: false,
        generatedDocx: null,
        generatedDocumentRecord: null,
        generationProgress: 20,
      })

      try {
        const generatedState = await config.generateDocument(workspaceState, workspace, { updateState })
        updateState({
          ...generatedState,
          generating: false,
          generationComplete: true,
          generationProgress: 100,
          generationError: '',
        })
      } catch (error) {
        updateState({
          generating: false,
          persistingOutput: false,
          generationComplete: false,
          generationProgress: 0,
          generationError: getFriendlyError(error, 'DOCX generation failed. Check the template placeholders and selected preview row, then try again.'),
        })
      }

      return
    }

    updateState({ generating: true, generationComplete: false, generationProgress: 20 })

    window.setTimeout(() => updateState({ generationProgress: 45 }), 450)
    window.setTimeout(() => updateState({ generationProgress: 75 }), 900)
    window.setTimeout(() => updateState({ generating: false, generationComplete: true, generationProgress: 100 }), 1350)
  }

  async function handleSaveWorkspace() {
    if (!config.saveWorkspace || workspaceState.savingDraft) {
      return
    }

    updateState({ savingDraft: true, draftError: '' })

    try {
      const savedState = await config.saveWorkspace(workspaceState, workspace)
      updateState({
        ...savedState,
        savingDraft: false,
        draftSavedAt: new Date().toISOString(),
      })
    } catch (error) {
      updateState({ savingDraft: false, draftError: getFriendlyError(error, 'The workspace could not be saved. Check the selected template, Excel upload, and field mapping, then try again.') })
    }
  }

  const actions = {
    updateState,
    generate: handleGenerate,
    saveWorkspace: handleSaveWorkspace,
  }
  const workspace = {
    product,
    organization: catalogState.organization,
    user,
  }

  return (
    <DashboardLayout title={`${product.name} Workspace`} eyebrow={config.eyebrow} showBack currentView="products" workspaceStatus={catalogState.status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner
          loading={catalogState.loading}
          error={catalogState.error}
          source={catalogState.source}
          status={catalogState.status}
          organization={catalogState.organization}
        />

        <WorkspaceHeader
          product={product}
          config={config}
          activeStep={activeStep}
          readinessPercentage={readinessPercentage}
          statusLabel={workspaceState.draftRecord && !workspaceState.draftDirty ? 'Draft saved' : 'Draft unsaved'}
          totalSteps={config.steps.length}
        />

        <div className="mt-5">
          <WorkspaceStepper
            steps={config.steps}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepChange={setActiveStep}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <StepRenderer step={activeStepConfig} state={workspaceState} actions={actions} config={config} workspace={workspace} />
          <ReadinessChecklist items={readinessItems} />
        </div>

        <WorkspaceFooter
          activeStep={activeStep}
          totalSteps={config.steps.length}
          canSave={Boolean(config.canSave ? config.canSave(workspaceState) : canGenerate)}
          saving={workspaceState.savingDraft}
          saveLabel="Save Workspace"
          onBack={() => setActiveStep((step) => Math.max(step - 1, 0))}
          onNext={() => setActiveStep((step) => Math.min(step + 1, config.steps.length - 1))}
          onSave={handleSaveWorkspace}
        />
      </div>
    </DashboardLayout>
  )
}
