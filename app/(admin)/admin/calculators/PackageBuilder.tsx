'use client';

import type { CalculatorConfigField, CalculatorFeature, CalculatorPackage } from '@/types/calculator';
import { PAGE_OPTIONS } from '@/lib/calculator';
import { Textarea } from '@/components/ui';

export default function PackageBuilder({ value, fields, hours, onChange }: {
  value?: CalculatorPackage;
  fields: (CalculatorConfigField | CalculatorFeature)[];
  hours: number;
  onChange: (value: CalculatorPackage) => void;
}) {
  const pack = value ?? { includedPages: [], includedFeatureIds: [], recommendedFeatureIds: [], includedServices: [] };
  const pages = fields.filter((field): field is CalculatorConfigField => 'type' in field && field.type === 'pages');
  const features = fields.filter((field): field is CalculatorFeature => 'hours' in field);
  const toggle = (key: 'includedPages' | 'includedFeatureIds' | 'recommendedFeatureIds', id: string) => {
    const selected = pack[key].includes(id);
    const next = { ...pack, [key]: selected ? pack[key].filter(item => item !== id) : [...pack[key], id] };
    if (!selected && key === 'includedFeatureIds') next.recommendedFeatureIds = next.recommendedFeatureIds.filter(item => item !== id);
    onChange(next);
  };
  return <details className="rounded-lg border border-blue-200 p-3" open={!!value}>
    <summary className="cursor-pointer font-semibold text-sm">Starting package</summary>
    <div className="mt-3 space-y-4 text-sm">
      <p className="text-gray-600">Included pages and features are selected automatically and charged once at their configured hours. Recommendations stay optional. Package setup hours cover the additional services listed below.</p>
      <label className="block font-medium">Page checklist
        <select className="mt-1 w-full rounded border p-2" value={pack.pageFieldId ?? ''} onChange={e => onChange({ ...pack, pageFieldId: e.target.value || undefined, includedPages: [] })}>
          <option value="">No included pages</option>
          {pages.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
        </select>
      </label>
      {pack.pageFieldId && <fieldset><legend className="font-medium mb-2">Included pages</legend><div className="grid sm:grid-cols-2 gap-2">{PAGE_OPTIONS.map(page => <label key={page.value} className="flex gap-2 items-center"><input type="checkbox" checked={pack.includedPages.includes(page.value)} onChange={() => toggle('includedPages', page.value)} />{page.label}</label>)}</div></fieldset>}
      <fieldset><legend className="font-medium mb-2">Included features</legend>
        <p className="text-xs text-gray-500 mb-2">Package inclusion takes precedence over a feature&apos;s visibility condition. Quantity features include their default allocation; linked page work follows the included page count. Globally mandatory features remain required.</p>
        <div className="space-y-2">{features.map(feature => <label key={feature.id} className="flex gap-2 items-start"><input type="checkbox" className="mt-1" checked={pack.includedFeatureIds.includes(feature.id)} onChange={() => toggle('includedFeatureIds', feature.id)} /><span>{feature.label} <span className="text-gray-500">({feature.hours} hours{feature.hasQuantity || feature.quantityFrom ? ' per unit' : ''}{feature.mandatory ? '; globally required' : ''})</span></span></label>)}</div>
      </fieldset>
      <fieldset><legend className="font-medium mb-2">Recommended extras</legend><div className="space-y-2">{features.filter(feature => !feature.mandatory && !pack.includedFeatureIds.includes(feature.id)).map(feature => <label key={feature.id} className="flex gap-2 items-start"><input type="checkbox" className="mt-1" checked={pack.recommendedFeatureIds.includes(feature.id)} onChange={() => toggle('recommendedFeatureIds', feature.id)} />{feature.label}</label>)}</div></fieldset>
      <Textarea label="Services covered by package setup hours (one per line)" rows={4} value={pack.includedServices.join('\n')} onChange={e => onChange({ ...pack, includedServices: e.target.value.split('\n') })} />
      {hours === 0 && pack.includedServices.some(service => service.trim()) && <p className="rounded bg-amber-50 p-3 text-amber-900">No extra setup hours are configured. Review whether these services are covered by your included features, and add package setup hours for any additional work.</p>}
    </div>
  </details>;
}
