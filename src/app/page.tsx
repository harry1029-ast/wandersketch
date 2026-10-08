'use client';

import React, { useEffect } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { Header } from '@/components/Header';
import { TripHubView } from '@/components/TripHubView';
import { RouteCuratorView } from '@/components/RouteCuratorView';
import { ScenicGuideView } from '@/components/ScenicGuideView';
import { TripCreationModal } from '@/components/Modals/TripCreationModal';
import { Compass, CalendarBlank } from '@phosphor-icons/react';

export default function Home() {
  const {
    appMode,
    currentStage,
    activeDayNumber,
    currentItineraryDays,
    initializeFromDatabase,
    isLoadingDb,
    isTripModalOpen,
    setTripModalOpen,
  } = useItineraryStore();

  useEffect(() => {
    initializeFromDatabase();
  }, [initializeFromDatabase]);

  const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-watercolor-ink relative">
      <Header />

      {isLoadingDb && (
        <div className="absolute top-18 right-6 z-50 px-3 py-1.5 bg-paper-100/90 border border-paper-900 rounded-xl text-xs font-mono shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-watercolor-brick animate-ping" />
          <span>Syncing with PostGIS DB...</span>
        </div>
      )}

      {/* Mode-driven View Routing */}
      {appMode === 'on-trip' ? (
        <div className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
          {/* Top Status Chip: On-Trip Mode Active — Day X */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all">
            <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 bg-paper-50/95 backdrop-blur-md border-2 border-paper-900 rounded-full shadow-float text-xs font-bold text-paper-900">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <div className="flex items-center gap-1.5 text-watercolor-green font-extrabold">
                <Compass size={16} weight="fill" />
                <span>On-Trip Mode Active</span>
              </div>
              <span className="text-paper-300">|</span>
              <div className="flex items-center gap-1 bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full border border-paper-900/40 text-[11px] font-black">
                <CalendarBlank size={13} weight="bold" />
                <span>Day {activeDayNumber || 1}</span>
              </div>
              {activeDay?.calendarDate && (
                <span className="text-paper-700 font-mono text-[11px] hidden sm:inline">
                  ({activeDay.calendarDate})
                </span>
              )}
            </div>
          </div>

          <ScenicGuideView />
        </div>
      ) : (
        <>
          {currentStage === 'plans' && <TripHubView />}
          {currentStage === 'planner' && <RouteCuratorView />}
          {currentStage === 'map' && <ScenicGuideView />}
        </>
      )}

      <TripCreationModal
        isOpen={isTripModalOpen}
        onClose={() => setTripModalOpen(false)}
      />
    </main>
  );
}