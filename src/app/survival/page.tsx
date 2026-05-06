import type { Metadata } from 'next';
import SurvivalContent from './SurvivalContent';

export const metadata: Metadata = {
  title: 'Survival Toolkit — ForageWise',
  description: 'Emergency field reference for toxic species, water indicators, and emergency contacts.',
};

export default function SurvivalPage() {
  return <SurvivalContent />;
}
