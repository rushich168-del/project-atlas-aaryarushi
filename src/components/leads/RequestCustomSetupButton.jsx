import { useState } from 'react'
import { Wrench } from 'lucide-react'
import CustomSetupRequestForm from './CustomSetupRequestForm.jsx'

// Project Atlas v3.7 — entry point for the "Request Custom Setup" lead form.
// Renders a button; opening it mounts the modal form. Pass `product` so the
// inquiry is prefilled with the product context when launched from a product
// card / detail / workspace surface.

export default function RequestCustomSetupButton({
  product = null,
  source = 'website',
  variant = 'primary',
  className = '',
  label = 'Request Custom Setup',
}) {
  const [open, setOpen] = useState(false)

  const variantClass =
    variant === 'outline'
      ? 'border border-accentTeal bg-white text-accentTeal hover:bg-teal-50'
      : 'bg-primary text-white hover:bg-slate-800'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${variantClass} ${className}`}
      >
        <Wrench size={16} aria-hidden="true" />
        {label}
      </button>
      {open ? (
        <CustomSetupRequestForm product={product} source={source} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}
