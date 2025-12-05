import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCalculatorBySlug } from '@/services/calculator-service';
import ServiceCalculator from '@/components/calculators/ServiceCalculator';
import { SerializedCalculator } from '@/types/calculator';

interface CalculatorPageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: CalculatorPageProps): Promise<Metadata> {
  const calculator = await getCalculatorBySlug(params.slug);

  if (!calculator) {
    return {
      title: 'Calculator Not Found',
    };
  }

  return {
    title: `${calculator.name} | Free Cost Estimator`,
    description:
      calculator.description ||
      `Use our free ${calculator.name} to get an instant estimate for your project.`,
    openGraph: {
      title: calculator.name,
      description: calculator.description || undefined,
      type: 'website',
    },
  };
}

/**
 * Calculator Public Page
 *
 * Displays a calculator by its slug
 * Returns 404 if calculator doesn't exist or is inactive
 */
export default async function CalculatorPage({ params }: CalculatorPageProps) {
  // Fetch calculator from Firestore
  const calculator = await getCalculatorBySlug(params.slug);

  // Show 404 if calculator not found or inactive
  if (!calculator) {
    notFound();
  }

  // Serialize calculator for client component
  // Convert Firestore Timestamps to ISO strings
  const serializedCalculator: SerializedCalculator = {
    ...calculator,
    createdAt: calculator.createdAt.toDate().toISOString(),
    updatedAt: calculator.updatedAt.toDate().toISOString(),
  };

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <ServiceCalculator calculator={serializedCalculator} />
        </div>
        <Footer />
    </div>
  );
}
