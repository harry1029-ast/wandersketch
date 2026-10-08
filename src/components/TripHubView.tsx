'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime } from '@/lib/audio';
import dynamic from 'next/dynamic';
import {
    Sparkle,
    Lightning,
    Clock,
    Trash,
    PencilSimple,
    ArrowLeft,
    Bed,
    ForkKnife,
    Ticket,
    Train,
    WarningCircle,
    CheckCircle,
    CalendarBlank,
    Plus,
    Coins,
    Receipt,
    ArrowsClockwise,
    MapTrifold,
    Compass,
    SuitcaseSimple,
} from '@phosphor-icons/react';
import { ExpenseCategory } from '@/types/itinerary';
import { RecommendationSwapModal } from '@/components/Modals/RecommendationSwapModal';
import { ExpenseBreakdownView } from '@/components/ExpenseBreakdownView';
import { QuickExcursionModal } from '@/components/Modals/QuickExcursionModal';

const DynamicIslandModal = dynamic(
    () => import('@/components/Modals/ContainedIslandModal').then((mod) => mod.ContainedIslandModal),
    { ssr: false }
);

export const TripHubView: React.FC = () => {
    const {
        savedPlans,
        activePlanId,
        selectedTripViewId,
        setSelectedTripViewId,
        selectTripForDetail,
        deletePlan,
        updatePlanTitle,
        setStage,
        setTripModalOpen,
        // Multi-day itinerary & budget state
        currentItineraryDays,
        activeDayNumber,
        totalBudgetCeiling,
        isOverBudget,
        budgetSummary,
        setActiveDay,
        addItineraryItem,
        removeItineraryItem,
        updateItemCost,
        updatePlannerZone,
    } = useItineraryStore();

    // Gallery local states
    const [selectedPlanForIsland, setSelectedPlanForIsland] = useState<string | null>(null);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editTitleDraft, setEditTitleDraft] = useState<string>('');
    const [isExcursionModalOpen, setIsExcursionModalOpen] = useState(false);

    // Detail view modal states
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [itemToSwap, setItemToSwap] = useState<any>(null);

    // Inline add item form state
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<ExpenseCategory>('ticket');
    const [newItemCost, setNewItemCost] = useState(25);

    const activePlan = savedPlans.find((p) => p.id === (selectedTripViewId || activePlanId)) || savedPlans[0];
    const zone = MASTER_ZONES[activePlan?.zoneKey] || MASTER_ZONES.toronto_distillery;

    const activeDay =
        currentItineraryDays.find((d) => d.dayNumber === activeDayNumber) ||
        currentItineraryDays[0];

    // Card handlers in gallery
    const handleOpenIslandModal = (e: React.MouseEvent, planId: string) => {
        e.stopPropagation();
        playChime('stamp');
        setSelectedPlanForIsland(planId);
    };

    const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
        e.stopPropagation();
        if (confirm('Delete this travel itinerary?')) {
            playChime('tap');
            await deletePlan(planId);
        }
    };

    const handleStartRename = (e: React.MouseEvent, planId: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingPlanId(planId);
        setEditTitleDraft(currentTitle);
    };

    const handleSaveRename = async (e: React.FormEvent, planId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (editTitleDraft.trim()) {
            playChime('stamp');
            await updatePlanTitle(planId, editTitleDraft.trim());
        }
        setEditingPlanId(null);
    };

    const handleCardClick = async (planId: string) => {
        playChime('tap');
        await selectTripForDetail(planId);
    };

    const handleLaunchOnMap = () => {
        playChime('stamp');
        setStage('map');
    };

    const handleEditRouteInCurator = () => {
        playChime('stamp');
        updatePlannerZone(activePlan.zoneKey);
        setStage('planner');
    };

    const handleAddItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !activeDay) return;
        playChime('stamp');
        addItineraryItem(activeDay.dayNumber, {
            name: newItemName.trim(),
            category: newItemCategory,
            estimatedCost: Math.max(0, Number(newItemCost) || 0),
            actualCost: 0,
            orderIndex: (activeDay.items?.length || 0),
        });
        setNewItemName('');
        setNewItemCost(25);
        setIsAddingItem(false);
    };

    const getCategoryIcon = (category: ExpenseCategory) => {
        switch (category) {
            case 'lodging':
                return <Bed size={16} weight="fill" className="text-indigo-800" />;
            case 'dining':
                return <ForkKnife size={16} weight="fill" className="text-amber-800" />;
            case 'ticket':
                return <Ticket size={16} weight="fill" className="text-rose-800" />;
            case 'transit':
                return <Train size={16} weight="fill" className="text-teal-800" />;
        }
    };

    const getCategoryBadgeClass = (category: ExpenseCategory) => {
        switch (category) {
            case 'lodging':
                return 'bg-indigo-100 text-indigo-950 border-indigo-300';
            case 'dining':
                return 'bg-amber-100 text-amber-950 border-amber-300';
            case 'ticket':
                return 'bg-rose-100 text-rose-950 border-rose-300';
            case 'transit':
                return 'bg-teal-100 text-teal-950 border-teal-300';
        }
    };

    return (
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-rice-paper">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ======================================================== */}
                {/* 1. GALLERY VIEW (When no trip is currently open in detail)*/}
                {/* ======================================================== */}
                {!selectedTripViewId ? (
                    <>
                        {/* Header Ribbon */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-paper-300 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-1 shrink-0">
                                        <SuitcaseSimple size={20} weight="fill" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-paper-900 font-serif">
                                        Trip Hub
                                    </h2>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-paper-900 font-mono">
                                        {savedPlans.length} Active Trips
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-paper-800 mt-1 max-w-xl">
                                    Click any trip card to view its <b>daily schedule, lodging, and live budget</b>. Or launch a quick 1-day excursion.
                                </p>
                            </div>

                            {/* Top Action Buttons (Replaced Create New Itinerary with + New Trip & Quick Excursion) */}
                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    onClick={() => {
                                        playChime('tap');
                                        setIsExcursionModalOpen(true);
                                    }}
                                    className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-paper-900 font-bold text-xs sm:text-sm rounded-2xl border-2 border-paper-900 shadow-xs flex items-center gap-1.5 transition active:scale-95"
                                    title="Quick 1-day single route journey"
                                >
                                    <Lightning size={16} weight="fill" className="text-amber-700" />
                                    <span>⚡ Quick Excursion</span>
                                </button>

                                <button
                                    onClick={() => {
                                        playChime('stamp');
                                        setTripModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-paper-900 font-black text-xs sm:text-sm rounded-2xl border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95"
                                    title="Generate new multi-day trip with AI"
                                >
                                    <Sparkle size={18} weight="fill" className="text-watercolor-brick" />
                                    <span>+ New Trip</span>
                                </button>
                            </div>
                        </div>

                        {/* Plans & Trips Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {savedPlans.map((plan) => {
                                const planZone = MASTER_ZONES[plan.zoneKey] || MASTER_ZONES.toronto_distillery;
                                const isExcursion = plan.isExcursion || plan.tag?.toLowerCase().includes('excursion') || plan.tag?.includes('1-Day');

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => handleCardClick(plan.id)}
                                        className="group relative bg-paper-100 hover:bg-white border-3 border-paper-900 rounded-3xl p-5 shadow-card hover:shadow-float transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <span
                                                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                                                        isExcursion
                                                            ? 'bg-amber-300 text-paper-900 border-paper-900'
                                                            : 'bg-watercolor-brick text-white border-paper-900'
                                                    }`}
                                                >
                                                    {isExcursion ? '⚡ 1-Day Excursion' : `${planZone.city} · ${plan.tag}`}
                                                </span>
                                                <span className="text-xs text-paper-800 font-serif">
                                                    {plan.createdAt}
                                                </span>
                                            </div>

                                            {editingPlanId === plan.id ? (
                                                <form onSubmit={(e) => handleSaveRename(e, plan.id)} className="my-1 flex gap-1">
                                                    <input
                                                        type="text"
                                                        value={editTitleDraft}
                                                        onChange={(e) => setEditTitleDraft(e.target.value)}
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 px-2 py-1 text-sm font-bold border-2 border-paper-900 rounded-lg bg-paper-50"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="px-2 py-1 bg-watercolor-brick text-white text-xs font-bold rounded-lg border border-paper-900"
                                                    >
                                                        Save
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="flex items-start justify-between gap-1 group/title">
                                                    <h3 className="font-black text-lg text-paper-900 font-serif leading-snug group-hover:text-watercolor-brick transition-colors">
                                                        {plan.title}
                                                    </h3>
                                                    <button
                                                        onClick={(e) => handleStartRename(e, plan.id, plan.title)}
                                                        title="Rename Plan"
                                                        className="p-1 opacity-0 group-hover/title:opacity-100 hover:bg-paper-200 rounded-lg text-paper-800 transition"
                                                    >
                                                        <PencilSimple size={14} weight="bold" />
                                                    </button>
                                                </div>
                                            )}

                                            <p className="text-xs text-paper-800 mt-2 line-clamp-2 leading-relaxed">
                                                Focused on {planZone.name}. {plan.daysCount ? `${plan.daysCount} days journey` : `${plan.spotIds.length} stops`} connected with hand-sketched walking trails.
                                            </p>

                                            {/* Illustrated Mini POI Stickers */}
                                            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-paper-200 overflow-x-hidden">
                                                {plan.spotIds.slice(0, 4).map((sid) => {
                                                    const lm = planZone.landmarksPool.find((l) => l.id === sid);
                                                    if (!lm) return null;
                                                    return (
                                                        <div
                                                            key={sid}
                                                            className="w-7 h-7 p-0.5 rounded-lg bg-paper-50 border border-paper-900 flex items-center justify-center shrink-0 shadow-2xs"
                                                            dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                                            title={lm.name}
                                                        />
                                                    );
                                                })}
                                                {plan.spotIds.length > 4 && (
                                                    <span className="text-[10px] font-mono font-bold text-paper-700 bg-paper-200 px-1.5 py-0.5 rounded-md">
                                                        +{plan.spotIds.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-paper-200">
                                            <div className="flex items-center gap-2 text-xs font-mono text-paper-800 font-bold">
                                                <span>{plan.estimatedDistance}</span>
                                                <span>·</span>
                                                <span className="flex items-center gap-0.5">
                                                    <Clock size={12} />
                                                    <span>{plan.estimatedDuration}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => handleDeletePlan(e, plan.id)}
                                                    title="Delete Travel Plan"
                                                    className="p-1.5 text-paper-700 hover:text-watercolor-brick hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash size={16} />
                                                </button>

                                                <button
                                                    onClick={(e) => handleOpenIslandModal(e, plan.id)}
                                                    className="px-2.5 py-1 bg-watercolor-brick hover:bg-red-700 text-white text-[11px] font-bold rounded-xl border border-paper-900 shadow-xs flex items-center gap-1 transition active:scale-95"
                                                    title="Open Stylized Island Mini-Map"
                                                >
                                                    <Sparkle size={13} weight="fill" className="text-amber-200" />
                                                    <span>Island Preview</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    /* ======================================================== */
                    /* 2. TRIP DETAIL & DAILY BREAKDOWN VIEW (Image 3)          */
                    /* ======================================================== */
                    <div className="space-y-6 animate-fade-in">
                        {/* Top Back & Action Ribbon */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-paper-300 pb-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        playChime('tap');
                                        setSelectedTripViewId(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs border border-paper-900 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                                >
                                    <ArrowLeft size={15} weight="bold" />
                                    <span>Back to All Trips</span>
                                </button>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-serif font-black text-xl text-paper-900">
                                            {activePlan.title}
                                        </h2>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-watercolor-brick text-white font-mono">
                                            {zone.city}
                                        </span>
                                    </div>
                                    <p className="text-xs text-paper-700 font-serif">
                                        {activePlan.createdAt} · {currentItineraryDays.length} Days Planned
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEditRouteInCurator}
                                    className="px-3.5 py-1.5 rounded-xl bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs border border-paper-900 shadow-xs flex items-center gap-1.5 transition active:scale-95"
                                    title="Open Route Curator to fine-tune walking waypoints"
                                >
                                    <Compass size={16} weight="bold" className="text-watercolor-brick" />
                                    <span>Edit Route Stops</span>
                                </button>

                                <button
                                    onClick={handleLaunchOnMap}
                                    className="px-4 py-1.5 rounded-xl bg-watercolor-brick hover:bg-red-700 text-white font-black text-xs border border-paper-900 shadow-stamp flex items-center gap-1.5 transition active:scale-95"
                                >
                                    <MapTrifold size={16} weight="fill" className="text-amber-200" />
                                    <span>Launch on Map</span>
                                </button>
                            </div>
                        </div>

                        {/* Top Dynamic Budget Ceiling Banner */}
                        {totalBudgetCeiling > 0 && (
                            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl p-5 shadow-card space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-paper-900 border-2 border-paper-900 flex items-center justify-center shadow-stamp shrink-0">
                                            <Coins size={22} weight="fill" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-paper-700 font-mono">
                                                Dynamic Budget Engine
                                            </span>
                                            <h3 className="text-lg font-black font-serif text-paper-900 leading-tight">
                                                Trip Budget Ceiling vs. Projected Total
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Status Indicator Badge & Ledger Action */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                playChime('tap');
                                                setIsLedgerOpen(true);
                                            }}
                                            className="px-3 py-1.5 rounded-2xl bg-paper-200 hover:bg-paper-300 text-paper-900 border-2 border-paper-900 font-black text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                                        >
                                            <Receipt size={16} weight="bold" className="text-watercolor-brick" />
                                            <span>View Detailed Ledger</span>
                                        </button>

                                        {isOverBudget ? (
                                            <div className="px-3.5 py-1.5 rounded-2xl bg-rose-100 text-rose-950 border-2 border-rose-700 font-black text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                                                <WarningCircle size={16} weight="fill" className="text-rose-700" />
                                                <span>
                                                    Over Budget by ${budgetSummary.estimatedTotal - totalBudgetCeiling}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-100 text-emerald-950 border-2 border-emerald-700 font-black text-xs flex items-center gap-1.5 shadow-sm">
                                                <CheckCircle size={16} weight="fill" className="text-emerald-700" />
                                                <span>
                                                    Within Budget (${totalBudgetCeiling - budgetSummary.estimatedTotal} remaining)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Totals Breakdown */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t-2 border-paper-200">
                                    <div className="bg-paper-50 rounded-xl p-2.5 border border-paper-300">
                                        <span className="text-[10px] font-bold text-paper-700 uppercase block">Total Ceiling</span>
                                        <span className="text-sm font-black text-paper-900 font-mono">${totalBudgetCeiling}</span>
                                    </div>
                                    <div className="bg-paper-50 rounded-xl p-2.5 border border-paper-300">
                                        <span className="text-[10px] font-bold text-paper-700 uppercase block">Projected Total</span>
                                        <span className={`text-sm font-black font-mono ${isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                                            ${budgetSummary.estimatedTotal}
                                        </span>
                                    </div>
                                    <div className="bg-paper-50 rounded-xl p-2.5 border border-paper-300">
                                        <span className="text-[10px] font-bold text-paper-700 uppercase block">Lodging & Dining</span>
                                        <span className="text-xs font-black text-paper-900 font-mono">
                                            ${budgetSummary.byCategory.lodging.estimated} / ${budgetSummary.byCategory.dining.estimated}
                                        </span>
                                    </div>
                                    <div className="bg-paper-50 rounded-xl p-2.5 border border-paper-300">
                                        <span className="text-[10px] font-bold text-paper-700 uppercase block">Tickets & Transit</span>
                                        <span className="text-xs font-black text-paper-900 font-mono">
                                            ${budgetSummary.byCategory.ticket.estimated} / ${budgetSummary.byCategory.transit.estimated}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Multi-Day Itinerary Agenda Section */}
                        <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl p-5 sm:p-6 shadow-card space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-paper-200 pb-4">
                                <div>
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-watercolor-brick text-white uppercase tracking-wider font-mono">
                                        Multi-Day Travel Agenda
                                    </span>
                                    <h3 className="font-black text-xl text-paper-900 font-serif mt-1">
                                        Daily Schedule & Expense Breakdown
                                    </h3>
                                    <p className="text-xs text-paper-800">
                                        Click any day tab to view hotel, dining, and activities. Edit costs inline to rebalance your budget.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        playChime('tap');
                                        setTripModalOpen(true);
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-paper-900 font-black text-xs border border-paper-900 shadow-sm flex items-center gap-1.5 shrink-0 transition"
                                >
                                    <Sparkle size={15} weight="fill" className="text-watercolor-brick" />
                                    <span>Re-plan with AI</span>
                                </button>
                            </div>

                            {/* Sticky Day-Picker Carousel */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {currentItineraryDays.map((day) => {
                                    const isActive = day.dayNumber === activeDayNumber;
                                    return (
                                        <button
                                            key={day.dayNumber}
                                            onClick={() => {
                                                playChime('tap');
                                                setActiveDay(day.dayNumber);
                                            }}
                                            className={`px-3.5 py-2 rounded-2xl border-2 font-bold text-xs flex items-center gap-2 transition shrink-0 ${
                                                isActive
                                                    ? 'bg-watercolor-brick text-white border-paper-900 shadow-stamp scale-102'
                                                    : 'bg-paper-50 hover:bg-paper-200 text-paper-900 border-paper-700 shadow-xs'
                                            }`}
                                        >
                                            <CalendarBlank size={15} weight={isActive ? 'fill' : 'bold'} />
                                            <span>Day {day.dayNumber}</span>
                                            {day.calendarDate && (
                                                <span
                                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                        isActive
                                                            ? 'bg-red-950 text-amber-100'
                                                            : 'bg-paper-200 text-paper-800'
                                                    }`}
                                                >
                                                    {day.calendarDate.slice(5)}
                                                </span>
                                            )}
                                            <span
                                                className={`text-[11px] font-black px-2 py-0.5 rounded-full font-mono ${
                                                    isActive
                                                        ? 'bg-amber-300 text-paper-900'
                                                        : 'bg-paper-200 text-paper-900'
                                                }`}
                                            >
                                                ${day.subtotalEstimated}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Day Agenda Details */}
                            {activeDay && (
                                <div className="space-y-4 pt-1">
                                    {/* Day Lodging Card */}
                                    {activeDay.hotelInfo && activeDay.hotelInfo.name && (
                                        <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 border-2 border-paper-900 flex items-center justify-center shrink-0 shadow-xs">
                                                    <Bed size={22} weight="fill" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-950 uppercase tracking-wider font-mono">
                                                            Overnight Lodging
                                                        </span>
                                                        <h4 className="font-serif font-black text-sm sm:text-base text-paper-900">
                                                            {activeDay.hotelInfo.name}
                                                        </h4>
                                                    </div>
                                                    {activeDay.hotelInfo.notes && (
                                                        <p className="text-xs text-paper-800 mt-1">
                                                            {activeDay.hotelInfo.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-paper-700 font-bold uppercase block">
                                                        Nightly Est.
                                                    </span>
                                                    <span className="text-sm font-black text-paper-900 font-mono">
                                                        ${activeDay.hotelInfo.price || 0}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        playChime('tap');
                                                        setItemToSwap({
                                                            category: 'lodging',
                                                            name: activeDay.hotelInfo?.name || 'Accommodations',
                                                            estimatedCost: activeDay.hotelInfo?.price || 0,
                                                            notes: activeDay.hotelInfo?.notes,
                                                        });
                                                        setIsSwapModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 rounded-xl bg-paper-100 hover:bg-paper-200 text-paper-900 border border-paper-700 text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                                                    title="Swap with alternative hotel"
                                                >
                                                    <ArrowsClockwise size={13} weight="bold" />
                                                    <span>Swap Hotel</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sequential Items & Meal Slots */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-paper-900 uppercase tracking-wider">
                                                Day {activeDay.dayNumber} Activities & Dining Sequence
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingItem(!isAddingItem)}
                                                className="text-xs font-bold text-watercolor-brick hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={14} weight="bold" />
                                                <span>{isAddingItem ? 'Close Form' : 'Add Custom Item'}</span>
                                            </button>
                                        </div>

                                        {/* Inline Add Item Form */}
                                        {isAddingItem && (
                                            <form
                                                onSubmit={handleAddItemSubmit}
                                                className="p-3 bg-amber-50 border-2 border-paper-900 rounded-2xl shadow-sm flex flex-wrap items-center gap-2"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Item name (e.g. Kyoto Tea Ceremony)"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    required
                                                    className="flex-1 min-w-[180px] bg-paper-100 border border-paper-700 rounded-xl px-3 py-1.5 text-xs font-bold text-paper-900 focus:outline-none"
                                                />
                                                <select
                                                    value={newItemCategory}
                                                    onChange={(e) => setNewItemCategory(e.target.value as ExpenseCategory)}
                                                    className="bg-paper-100 border border-paper-700 rounded-xl px-2 py-1.5 text-xs font-bold text-paper-900 focus:outline-none"
                                                >
                                                    <option value="ticket">Ticket / Activity</option>
                                                    <option value="dining">Dining / Meal</option>
                                                    <option value="transit">Transit / Transfer</option>
                                                    <option value="lodging">Lodging</option>
                                                </select>
                                                <div className="flex items-center gap-1 bg-paper-100 border border-paper-700 rounded-xl px-2 py-1.5">
                                                    <span className="text-xs font-black text-paper-700">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={newItemCost}
                                                        onChange={(e) => setNewItemCost(Number(e.target.value) || 0)}
                                                        className="w-14 bg-transparent text-xs font-bold text-paper-900 focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="px-3 py-1.5 rounded-xl bg-watercolor-brick text-white text-xs font-black shadow-xs hover:bg-red-700 cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </form>
                                        )}

                                        {/* List of active day items */}
                                        {(activeDay.items || []).map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-sm hover:border-watercolor-brick transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-paper-200 border border-paper-900 text-paper-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>

                                                    <div
                                                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${getCategoryBadgeClass(
                                                            item.category
                                                        )}`}
                                                    >
                                                        {getCategoryIcon(item.category)}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border font-mono ${getCategoryBadgeClass(
                                                                    item.category
                                                                )}`}
                                                            >
                                                                {item.category}
                                                            </span>
                                                            <h5 className="font-extrabold text-paper-900 text-xs sm:text-sm font-serif">
                                                                {item.name}
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cost Inline Edit, Swap & Delete */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div
                                                        className="flex items-center gap-1 bg-paper-100 border border-paper-700 rounded-xl px-2 py-1"
                                                        title="Edit estimated cost"
                                                    >
                                                        <span className="text-xs font-black text-paper-700">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="5"
                                                            value={item.estimatedCost}
                                                            onChange={(e) => {
                                                                const val = Math.max(0, Number(e.target.value) || 0);
                                                                updateItemCost(item.id, val, item.actualCost);
                                                            }}
                                                            className="w-14 bg-transparent text-xs font-black text-paper-900 font-mono focus:outline-none"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            playChime('tap');
                                                            setItemToSwap(item);
                                                            setIsSwapModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-paper-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                                                        title="Swap with alternative recommendation"
                                                    >
                                                        <ArrowsClockwise size={15} weight="bold" />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            playChime('tap');
                                                            removeItineraryItem(item.id);
                                                        }}
                                                        className="p-1.5 text-paper-700 hover:text-watercolor-brick hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Remove Item"
                                                    >
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Expense Breakdown Dual Ledger Modal */}
            <ExpenseBreakdownView
                isOpen={isLedgerOpen}
                onClose={() => setIsLedgerOpen(false)}
            />

            {/* Alternative Recommendation Swap Modal */}
            <RecommendationSwapModal
                isOpen={isSwapModalOpen}
                onClose={() => {
                    setIsSwapModalOpen(false);
                    setItemToSwap(null);
                }}
                itemToSwap={itemToSwap}
                dayNumber={activeDay?.dayNumber || 1}
            />

            {/* Quick 1-Day Excursion Modal */}
            <QuickExcursionModal
                isOpen={isExcursionModalOpen}
                onClose={() => setIsExcursionModalOpen(false)}
            />

            {/* Stylized Island Modal Preview */}
            {selectedPlanForIsland && (
                <DynamicIslandModal
                    isOpen={Boolean(selectedPlanForIsland)}
                    onClose={() => setSelectedPlanForIsland(null)}
                />
            )}
        </section>
    );
};
