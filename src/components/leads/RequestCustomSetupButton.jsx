import { useState } from 'react'
import { Wrench } from 'lucide-react'
import CustomSetupRequestForm from './CustomSetupRequestForm.jsx'

// Project Atlas v3.7 / v3.9 — entry point for the "Request Custom Setup" lead form.
// Renders a button; opening it mounts the modal form. Pass `product` so the inquiry
// is prefilled with that product's context when launched from a product card /
// detail / workspace surface. `source` records where the request began (e.g.
// product-card, product-detail, product-workspace, dashboard, generic).
//
// v3.9 adds small presentation props so one component can serve dense cards and
// full-width panels without duplicating the modal/form logic:
//   * variant — 'primary' (solid) or 'outline' (secondary)
//   * size    — 'sm' (compact cards) or 'md' (default)
//   * fullWidth — stretch the button to its container
//   * supportingText — a short helper line rendered above the button

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-slate-800',
  outline: 'border border-accentTeal bg-white text-accentTeal hover:bg-teal-50',
}

const sizeClasses = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
}

export default function RequestCustomSetupButton({
  product = null,
  source = 'website',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  supportingText = '',
  className = '',
  label = 'Request Custom Setup',
}) {
  const [open, setOpen] = useState(false)

  const variantClass = variantClasses[variant] || variantClasses.primary
  const sizeClass = sizeClasses[size] || sizeClasses.md
  const widthClass = fullWidth ? 'w-full' : ''

  const button = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md font-semibold transition ${variantClass} ${sizeClass} ${widthClass} ${className}`}
    >
      <Wrench size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      {label}
    </button>
  )

  return (
    <>
      {supportingText ? (
        <div className={fullWidth ? 'w-full' : ''}>
          <p className="mb-1.5 text-[11px] font-semibold leading-4 text-slate-500">{supportingText}</p>
          {button}
        </div>
      ) : (
        button
      )}
      {open ? (
        <CustomSetupRequestForm product={product} source={source} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}
