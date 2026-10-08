'use client';

import React, { useEffect } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { Header } from '@/components/Header';
import { PlansLibraryView } from '@/components/PlansLibraryView';
import { PlannerView } from '@/components/PlannerView';
import { ScenicGuideView } from '@/components/ScenicGuideView';
import { TripCreationModal } from '@/components/Modals/TripCreationModal';

export default function Home() {
  const { currentStage, initializeFromDatabase, isLoadingDb, isTripModalOpen, setTripModalOpen } = useItineraryStore();

  useEffect(() => {
    initializeFromDatabase();
  }, [initializeFromDatabase]);

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-watercolor-ink">
      <Header />

      {isLoadingDb && (
        <div className="absolute top-18 right-6 z-50 px-3 py-1.5 bg-paper-100/90 border border-paper-900 rounded-xl text-xs font-mono shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-watercolor-brick animate-ping" />
          <span>Syncing with PostGIS DB...</span>
        </div>
      )}

      {currentStage === 'plans' && <PlansLibraryView />}
      {currentStage === 'planner' && <PlannerView />}
      {currentStage === 'map' && <ScenicGuideView />}

      <TripCreationModal
        isOpen={isTripModalOpen}
        onClose={() => setTripModalOpen(false)}
      />
    </main>
  );
}