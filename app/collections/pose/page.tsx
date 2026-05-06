import type { Metadata } from 'next';
import PoseHeroSection from '@/components/PoseHeroSection';
import PoseVariantsStack from '@/components/PoseVariantsStack';

export const metadata: Metadata = {
  title: 'Posé Collection — Mateo Chair',
  description:
    'The Mateo chair, three ways. Sculptural plywood seating from Squarage Studio — handcrafted in Los Angeles.',
  alternates: {
    canonical: 'https://squarage.com/collections/pose',
  },
  openGraph: {
    title: 'Posé Collection — Mateo Chair',
    description:
      'The Mateo chair, three ways. Sculptural plywood seating from Squarage Studio.',
    type: 'website',
  },
};

export default function PosePage() {
  return (
    <main className="min-h-screen bg-cream">
      <PoseHeroSection />

      <section className="py-16 md:py-24 text-center px-4">
        <h2
          className="font-bold font-neue-haas text-squarage-black"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
        >
          Meet the <span className="font-soap font-normal text-squarage-green">Mateo</span> chair
        </h2>
      </section>

      <PoseVariantsStack />
    </main>
  );
}
