export default function StepRenderer({ step, state, actions, config, workspace }) {
  const StepComponent = step.component

  if (!StepComponent) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-primary">{step.label}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">This step is configured but does not have a renderer yet.</p>
      </section>
    )
  }

  return <StepComponent step={step} state={state} actions={actions} config={config} workspace={workspace} />
}
