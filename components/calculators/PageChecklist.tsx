'use client';

import type { CalculatorConfigField, CalculatorPageSelection } from '@/types/calculator';
import { PAGE_OPTIONS, pageCount } from '@/lib/calculator';
import { Button, Input } from '@/components/ui';

interface Props {
  field: CalculatorConfigField;
  value: CalculatorPageSelection;
  onChange: (value: CalculatorPageSelection) => void;
}

export default function PageChecklist({ field, value, onChange }: Props) {
  const count = pageCount(field, value);
  const helpId = `${field.id}-page-help`;
  const max = field.max ?? 100;
  const atLimit = !value.unsure && value.pages.length + value.otherPages.length >= max;

  return <fieldset aria-describedby={helpId} className="space-y-4">
    <legend className="text-lg font-semibold">{field.label}</legend>
    <p id={helpId} className="text-sm text-gray-600">{field.helpText || 'Choose what you have in mind. We’ll help confirm the pages during your consultation.'}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PAGE_OPTIONS.map(option => {
        const selected = value.pages.includes(option.value);
        return <label key={option.value} className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary-600" checked={selected} disabled={!selected && atLimit} onChange={e => onChange({ ...value, unsure: false, pages: e.target.checked ? [...value.pages, option.value] : value.pages.filter(page => page !== option.value) })} />
          <span><span className="block font-medium">{option.label}</span><span className="block text-sm text-gray-600 mt-1">{option.description}</span></span>
        </label>;
      })}
      <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${value.otherPages.length ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary-600" checked={value.otherPages.length > 0} disabled={!value.otherPages.length && atLimit} onChange={e => onChange({ ...value, unsure: false, otherPages: e.target.checked ? [''] : [] })} />
        <span><span className="block font-medium">Other</span><span className="block text-sm text-gray-600 mt-1">Add pages such as a portfolio, bookings or careers.</span></span>
      </label>
    </div>
    {value.otherPages.length > 0 && <div className="space-y-3 rounded-lg bg-gray-50 p-4">
      {value.otherPages.map((name, index) => <div key={index} className="flex items-end gap-3">
        <div className="flex-1"><Input id={`${field.id}-other-${index}`} label={`Additional page ${index + 1}`} placeholder="e.g., Portfolio" maxLength={100} value={name} onChange={e => onChange({ ...value, otherPages: value.otherPages.map((page, i) => i === index ? e.target.value : page) })} /></div>
        <Button type="button" variant="secondary" aria-label={`Remove additional page ${index + 1}`} onClick={() => onChange({ ...value, otherPages: value.otherPages.filter((_, i) => i !== index) })}>Remove</Button>
      </div>)}
      <Button type="button" size="sm" variant="secondary" disabled={atLimit} onClick={() => onChange({ ...value, otherPages: [...value.otherPages, ''] })}>Add another page</Button>
    </div>}
    <p className="text-sm text-gray-600">Blog and Shop each count as one section here, not one page per post or product. We’ll confirm any additional layouts together.</p>
    <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer">
      <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={value.unsure} onChange={e => onChange({ pages: [], otherPages: [], unsure: e.target.checked })} />
      <span>I’m not sure yet</span>
    </label>
    <div className="rounded-lg bg-primary-50 p-4 text-sm" aria-live="polite">
      {value.unsure ? <><strong>We’ll help you plan your pages.</strong><p className="mt-1">For now, your estimate assumes {count} {count === 1 ? 'page' : 'pages'}. We’ll confirm the scope during your consultation.</p></> : <><strong>You’ve selected {count} {count === 1 ? 'page' : 'pages'}.</strong>{count === 0 && <p className="mt-1">Choose your pages to refine the starting estimate, or let us help you decide.</p>}</>}
      {atLimit && <p className="mt-1">You’ve reached this calculator’s limit of {max} pages. We can discuss a larger site during your consultation.</p>}
    </div>
  </fieldset>;
}
