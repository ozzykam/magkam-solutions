import type { CalculatorConfigField } from '@/types/calculator';

type Option = NonNullable<CalculatorConfigField['options']>[number];

function Guidance({ option }: { option: Option }) {
  const examples = option.examples?.filter(example => example.trim()) ?? [];
  const pages = option.suggestedPages?.filter(page => page.trim()) ?? [];
  return <div className="space-y-3 text-sm text-gray-700">
    {option.description && <p>{option.description}</p>}
    {!!examples.length && <div><h4 className="font-semibold text-gray-900">Examples</h4><ul className="mt-1 list-disc pl-5 space-y-1">{examples.map((example, index) => <li key={index}>{example}</li>)}</ul></div>}
    {!!pages.length && <div><h4 className="font-semibold text-gray-900">Pages you might want</h4><div className="flex flex-wrap gap-2 mt-2">{pages.map((page, index) => <span key={index} className="rounded-full border border-primary-200 bg-white px-3 py-1">{page}</span>)}</div></div>}
  </div>;
}

export default function SolutionGuidance({ field, value }: { field: CalculatorConfigField; value: string | number | undefined }) {
  const options = field.options?.filter(option => option.description || option.examples?.length || option.suggestedPages?.length) ?? [];
  if (!options.length) return null;
  const selected = options.find(option => String(option.value) === String(value));
  return <div className="mt-3 space-y-3">
    {selected && <section aria-label={`About ${selected.label}`} className="rounded-lg border border-primary-200 bg-primary-50 p-4 sm:p-5">
      <h3 className="font-semibold text-gray-900 mb-2">About {selected.label}</h3>
      <Guidance option={selected} />
      <p className="text-xs text-gray-600 mt-4">{selected.package ? 'Your package summary above lists the included pages and services. Use these examples to choose any extras below; we’ll confirm the scope together.' : 'Use these examples to choose the pages and features you need below; we’ll confirm the scope together.'}</p>
    </section>}
    <details className="rounded-lg border border-gray-200 p-4">
      <summary className="cursor-pointer font-medium text-sm">Compare solution types</summary>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{options.map(option => <section key={option.value} className="rounded-lg bg-gray-50 p-4"><h3 className="font-semibold mb-2">{option.label}</h3><Guidance option={option} /></section>)}</div>
    </details>
  </div>;
}
