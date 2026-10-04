'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { Header } from '@/components/Header';
import { PlansLibraryView } from '@/components/PlansLibraryView';
import { PlannerView } from '@/components/PlannerView';

export default function Home() {
  const { currentStage } = useItineraryStore();

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-watercolor-ink">
      <Header />

      {currentStage === 'plans' && <PlansLibraryView />}
      {currentStage === 'planner' && <PlannerView />}
      {currentStage === 'map' && (
        <div className="flex-1 flex items-center justify-center bg-rice-paper">
          <div className="text-center p-6 max-w-md bg-paper-100 border-2 border-paper-900 rounded-3xl shadow-card">
            <h3 className="font-serif font-black text-xl text-paper-900 mb-2">
              Illustrated Map Stage Ready
            </h3>
            <p className="text-xs text-paper-800 mb-4">
              The Planner and Plans Library are active. Next, we will connect the dynamic Leaflet base layer with the Rough.js wobbly paths.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}