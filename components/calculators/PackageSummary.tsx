import type { Calculator, CalculatorEstimate } from '@/types/calculator';
import { activePackages, packageFeatureIds, isFeatureVisible, PAGE_OPTIONS } from '@/lib/calculator';

export default function PackageSummary({ calculator, config, selections, estimate }: {
  calculator: Pick<Calculator, 'steps' | 'defaultHourlyRate'>;
  config: Record<string, string | number>;
  selections: Record<string, boolean | number>;
  estimate: CalculatorEstimate;
}) {
  const packages = activePackages(calculator, config);
  if (!packages.length) return null;
  const required = packageFeatureIds(calculator, config);
  const pageIds = [...new Set(packages.flatMap(item => item.includedPages))];
  const features = calculator.steps.flatMap(step => step.fields).filter(field => 'hours' in field && (required.includes(field.id) || (field.mandatory && isFeatureVisible(field, config, selections))));
  const services = [...new Set([...features.map(field => field.label), ...packages.flatMap(item => item.includedServices).filter(service => service.trim())])];
  return <section aria-label="Your solution package" className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-5">
    <h2 className="font-semibold text-lg">{packages.map(item => item.name).join(' + ')} foundation</h2>
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      <div><dt className="text-sm text-gray-600">Base estimate</dt><dd className="text-xl font-bold">${estimate.basePrice.toLocaleString()}</dd></div>
      <div><dt className="text-sm text-gray-600">Your additions</dt><dd className="text-xl font-bold">${estimate.additionsPrice.toLocaleString()}</dd></div>
      <div><dt className="text-sm text-gray-600">Estimated total</dt><dd className="text-xl font-bold text-primary-700">${estimate.totalPrice.toLocaleString()}</dd></div>
    </dl>
    {pageIds.length > 0 && <p className="text-sm mt-4"><strong>Included pages:</strong> {PAGE_OPTIONS.filter(page => pageIds.includes(page.value)).map(page => page.label).join(', ')}</p>}
    {services.length > 0 && <div className="mt-3 text-sm"><h3 className="font-semibold">Included services</h3><ul className="mt-1 list-disc pl-5 space-y-1">{services.map(service => <li key={service}>{service}</li>)}</ul></div>}
    <p className="mt-4 text-xs text-gray-600">Included work is counted once in the base estimate. Additional pages and optional features update your additions. Final scope is confirmed during consultation.</p>
  </section>;
}
