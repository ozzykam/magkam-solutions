import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { calculateEstimate, configErrors, featureQuantity, initialConfig, prepareCalculator, pageCount, pageSelectionErrors, pageSummary } from '@/lib/calculator';
import type { Calculator, CalculatorPageSelection } from '@/types/calculator';
import { getClientIdentifier } from '@/lib/utils/rate-limit';

const schema = z.object({
  calculatorId: z.string().min(1).max(200).regex(/^[^/]+$/),
  selections: z.record(z.string().max(200), z.union([z.boolean(), z.number().finite(), z.string().max(2000)])),
  config: z.record(z.string().max(200), z.union([z.number().finite(), z.string().max(2000)])),
  pageSelections: z.record(z.string().max(200), z.object({
    pages: z.array(z.string().max(50)).max(7),
    otherPages: z.array(z.string().trim().max(100)).max(100),
    unsure: z.boolean(),
  })).optional(),
  contactInfo: z.object({ name: z.string().trim().min(1).max(150), email: z.email().max(254) }),
  consent: z.literal(true),
  website: z.string().max(0),
});

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 32_000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    let json: unknown;
    try { json = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Check your answers, name, email and contact consent.' }, { status: 400 });
    const input = parsed.data;
    const db = getAdminFirestore();
    const [settings, document] = await Promise.all([
      db.doc('storeSettings/main').get(), db.collection('calculators').doc(input.calculatorId).get(),
    ]);
    if (settings.data()?.features?.calculators?.enabled !== true || !document.exists || document.data()?.isActive !== true) {
      return NextResponse.json({ error: 'This calculator is currently unavailable.' }, { status: 404 });
    }
    const calculator = prepareCalculator({ ...document.data(), id: document.id } as Calculator);
    const config = initialConfig(calculator);
    const pageSelections: Record<string, CalculatorPageSelection> = {};
    const pageSummaries: Record<string, string> = {};
    const selections: Record<string, boolean | number> = {};
    for (const field of calculator.steps.flatMap(step => step.fields)) {
      if ('type' in field && field.type === 'pages') {
        const selected = input.pageSelections?.[field.id];
        const errors = pageSelectionErrors(field, selected);
        if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });
        pageSelections[field.id] = selected!;
        pageSummaries[field.id] = pageSummary(field, selected!);
        config[field.id] = pageCount(field, selected!);
      } else if ('type' in field && field.id !== 'hourly_rate' && input.config[field.id] !== undefined) config[field.id] = input.config[field.id];
    }
    const errors = configErrors(calculator.steps.flatMap(step => step.fields), config);
    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });
    for (const field of calculator.steps.flatMap(step => step.fields)) {
      if ('hours' in field) {
        selections[field.id] = field.mandatory === true || input.selections[field.id] === true;
        if (field.hasQuantity || field.quantityFrom) selections[`${field.id}_qty`] = featureQuantity(field, config, input.selections);
      }
    }
    const estimate = calculateEstimate(calculator, config, selections);
    const answers = calculator.steps.flatMap(step => step.fields).flatMap(field => {
      if (!('type' in field) || field.id === 'hourly_rate') return [];
      if (field.type === 'pages') return [`${field.label}: ${pageSummaries[field.id]}`];
      const value = config[field.id];
      const label = field.options?.find(option => String(option.value) === String(value))?.label ?? value;
      return [`${field.label}: ${label}`];
    });
    const submission = db.collection('calculatorSubmissions').doc();
    const message = db.collection('contactMessages').doc(submission.id);
    const now = Timestamp.now();
    const identifier = createHash('sha256').update(getClientIdentifier(request)).digest('hex');
    const limiter = db.collection('calculatorRateLimits').doc(identifier);
    // Durable across server instances; lead and inbox message succeed or fail together.
    const accepted = await db.runTransaction(async transaction => {
      const previous = (await transaction.get(limiter)).data();
      const inWindow = previous && now.toMillis() - previous.windowStart.toMillis() < 60_000;
      const count = inWindow ? previous.count : 0;
      if (count >= 5) return false;
      transaction.set(limiter, { count: count + 1, windowStart: inWindow ? previous.windowStart : now });
      transaction.set(submission, {
        id: submission.id, calculatorId: calculator.id, calculatorName: calculator.name,
        config, selections, pageSelections, pageSummaries, ...estimate, contactInfo: input.contactInfo,
        consent: true, submittedAt: now, status: 'pending',
      });
      transaction.set(message, {
        name: input.contactInfo.name, email: input.contactInfo.email,
        subject: `Calculator Estimate Request - ${calculator.name}`, source: 'calculator',
        message: [`Calculator: ${calculator.name}`, ...answers, '', ...estimate.lineItems.map(item => `${item.label}: ${item.hours} hours — $${item.cost.toLocaleString('en-US')}`), '', `Estimated total: $${estimate.totalPrice.toLocaleString('en-US')}`, `Hourly rate: $${estimate.hourlyRate}`, 'The visitor consented to contact about this project estimate.'].join('\n'),
        metadata: { calculatorId: calculator.id, submissionId: submission.id, totalPrice: estimate.totalPrice, totalHours: estimate.totalHours },
        isRead: false, isArchived: false, createdAt: now,
      });
      return true;
    });
    if (!accepted) return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429, headers: { 'Retry-After': '60' } });
    return NextResponse.json({ id: submission.id, estimate }, { status: 201 });
  } catch (error) {
    console.error('Calculator submission failed:', error);
    return NextResponse.json({ error: 'Unable to save your estimate. Please try again.' }, { status: 500 });
  }
}
