'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { Header } from '@/components/Header';
import { PlansLibraryView } from '@/components/PlansLibraryView';
import { PlannerView } from '@/components/PlannerView';
import { ScenicGuideView } from '@/components/ScenicGuideView';

export default function Home() {
  const { currentStage } = useItineraryStore();

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-watercolor-ink">
      <Header />

      {currentStage === 'plans' && <PlansLibraryView />}
      {currentStage === 'planner' && <PlannerView />}
      {currentStage === 'map' && <ScenicGuideView />}
    </main>
  );
}