'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import { ExpenseCategory } from '@/types/itinerary';
import {
    X,
    Receipt,
    Bed,
    ForkKnife,
    Ticket,
    Train,
    Coins,
    WarningCircle,
    CheckCircle,
    CaretDown,
    CaretUp,
    CalendarBlank,
} from '@phosphor-icons/react';

interface ExpenseBreakdownViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExpenseBreakdownView: React.FC<ExpenseBreakdownViewProps> = ({ isOpen, onClose }) => {
    const {
        currentItineraryDays,
        totalBudgetCeiling,
        isOverBudget,
        budgetSummary,
        updateItemCost,
    } = useItineraryStore();

    // Track which days are expanded in the ledger
    const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});

    if (!isOpen) return null;

    const toggleDayCollapse = (dayNumber: number) => {
        playChime('tap');
        setCollapsedDays((prev) => ({
            ...prev,
            [dayNumber]: !prev[dayNumber],
        }));
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

    const categories: ExpenseCategory[] = ['lodging', 'dining', 'ticket', 'transit'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-paper-900/65 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-float relative flex flex-col max-h-[92vh] overflow-y-auto">

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-paper-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900">
                            <Receipt size={22} weight="fill" className="text-amber-200" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-paper-700 font-mono">
                                Travel Archive Dual Ledger
                            </span>
                            <h2 className="font-serif font-black text-xl text-paper-900 leading-tight">
                                Expense Breakdown & Budget Audit
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        className="p-1.5 rounded-xl text-paper-700 hover:text-paper-900 hover:bg-paper-200 transition"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Grand Totals & Overrun Banner */}
                <div className="my-5 bg-paper-50 border-2 border-paper-900 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <Coins size={20} weight="fill" className="text-amber-600" />
                            <h3 className="font-serif font-black text-base text-paper-900">
                                Ledger Financial Summary
                            </h3>
                        </div>

                        {/* Status Badge */}
                        <div>
                            {isOverBudget ? (
                                <div className="px-3 py-1 rounded-xl bg-rose-100 text-rose-950 border-2 border-rose-700 font-black text-xs flex items-center gap-1.5 animate-pulse">
                                    <WarningCircle size={16} weight="fill" className="text-rose-700" />
                                    <span>Over Budget by ${budgetSummary.estimatedTotal - totalBudgetCeiling}</span>
                                </div>
                            ) : (
                                <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 border-2 border-emerald-700 font-black text-xs flex items-center gap-1.5">
                                    <CheckCircle size={16} weight="fill" className="text-emerald-700" />
                                    <span>Within Budget (${totalBudgetCeiling - budgetSummary.estimatedTotal} buffer)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-paper-100 rounded-2xl p-3 border border-paper-300">
                            <span className="text-[10px] font-bold text-paper-700 uppercase block">Total Ceiling</span>
                            <span className="text-base font-black text-paper-900 font-mono">${totalBudgetCeiling}</span>
                        </div>
                        <div className="bg-paper-100 rounded-2xl p-3 border border-paper-300">
                            <span className="text-[10px] font-bold text-paper-700 uppercase block">Total Estimated</span>
                            <span className={`text-base font-black font-mono ${isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                                ${budgetSummary.estimatedTotal}
                            </span>
                        </div>
                        <div className="bg-paper-100 rounded-2xl p-3 border border-paper-300">
                            <span className="text-[10px] font-bold text-paper-700 uppercase block">Total Actual Spent</span>
                            <span className="text-base font-black text-paper-900 font-mono">
                                ${budgetSummary.actualTotal}
                            </span>
                        </div>
                        <div className="bg-paper-100 rounded-2xl p-3 border border-paper-300">
                            <span className="text-[10px] font-bold text-paper-700 uppercase block">Actual Variance</span>
                            <span className={`text-base font-black font-mono ${
                                budgetSummary.actualTotal > budgetSummary.estimatedTotal ? 'text-rose-700' : 'text-emerald-700'
                            }`}>
                                {budgetSummary.actualTotal > budgetSummary.estimatedTotal ? '+' : ''}
                                ${budgetSummary.actualTotal - budgetSummary.estimatedTotal}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Categorized Summary Grid (Lodging, Dining, Tickets, Transit) */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-paper-900">
                        Category Expense Distribution
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {categories.map((cat) => {
                            const data = budgetSummary.byCategory[cat] || { estimated: 0, actual: 0 };
                            const pct = budgetSummary.estimatedTotal > 0
                                ? Math.round((data.estimated / budgetSummary.estimatedTotal) * 100)
                                : 0;

                            return (
                                <div
                                    key={cat}
                                    className="p-3.5 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-xs space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`p-1 rounded-lg border ${getCategoryBadgeClass(cat)}`}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <span className="font-serif font-black text-xs text-paper-900 uppercase">
                                                {cat}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-paper-200 text-paper-900 font-mono">
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-paper-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                cat === 'lodging'
                                                    ? 'bg-indigo-600'
                                                    : cat === 'dining'
                                                    ? 'bg-amber-600'
                                                    : cat === 'ticket'
                                                    ? 'bg-rose-600'
                                                    : 'bg-teal-600'
                                            }`}
                                            style={{ width: `${Math.min(100, pct)}%` }}
                                        />
                                    </div>

                                    {/* Side by side Estimated vs Actual */}
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-paper-200">
                                        <div>
                                            <span className="text-[10px] text-paper-700 block">Est.</span>
                                            <span className="font-black font-mono text-paper-900">${data.estimated}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-paper-700 block">Actual</span>
                                            <span className="font-black font-mono text-paper-900">${data.actual}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day-by-Day Itemized Expandable Table */}
                <div className="mt-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-paper-900">
                        Itemized Day-by-Day Ledger
                    </h4>

                    {currentItineraryDays.map((day) => {
                        const isCollapsed = collapsedDays[day.dayNumber];
                        return (
                            <div
                                key={day.dayNumber}
                                className="bg-paper-50 border-2 border-paper-900 rounded-2xl overflow-hidden shadow-xs"
                            >
                                {/* Day Section Header */}
                                <div
                                    onClick={() => toggleDayCollapse(day.dayNumber)}
                                    className="p-3 bg-paper-200/70 flex items-center justify-between cursor-pointer hover:bg-paper-200 transition"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CalendarBlank size={16} weight="bold" className="text-watercolor-brick" />
                                        <h5 className="font-serif font-black text-sm text-paper-900">
                                            Day {day.dayNumber}
                                        </h5>
                                        {day.calendarDate && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-paper-100 text-paper-800 border border-paper-300">
                                                {day.calendarDate}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right text-xs">
                                            <span className="text-[10px] text-paper-700 mr-2 font-mono">
                                                Est: <b>${day.subtotalEstimated}</b>
                                            </span>
                                            <span className="text-[10px] text-paper-700 font-mono">
                                                Actual: <b>${day.subtotalActual}</b>
                                            </span>
                                        </div>
                                        <button className="text-paper-800 p-1">
                                            {isCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                {!isCollapsed && (
                                    <div className="p-3 divide-y divide-paper-200">
                                        <div className="grid grid-cols-12 text-[10px] font-black uppercase text-paper-700 pb-2 px-2">
                                            <span className="col-span-6 sm:col-span-7">Line Item</span>
                                            <span className="col-span-3 sm:col-span-2 text-right">Est. Cost</span>
                                            <span className="col-span-3 sm:col-span-3 text-right">Actual Cost</span>
                                        </div>

                                        {(day.items || []).map((item) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-12 items-center py-2 px-2 hover:bg-paper-100/70 rounded-xl transition text-xs"
                                            >
                                                <div className="col-span-6 sm:col-span-7 flex items-center gap-2">
                                                    <div className={`p-1 rounded-md border shrink-0 ${getCategoryBadgeClass(item.category)}`}>
                                                        {getCategoryIcon(item.category)}
                                                    </div>
                                                    <span className="font-bold text-paper-900 truncate">
                                                        {item.name}
                                                    </span>
                                                </div>

                                                <div className="col-span-3 sm:col-span-2 text-right font-black font-mono text-paper-900">
                                                    ${item.estimatedCost}
                                                </div>

                                                <div className="col-span-3 sm:col-span-3 flex justify-end">
                                                    <div className="flex items-center gap-1 bg-paper-100 border border-paper-700 rounded-lg px-2 py-0.5">
                                                        <span className="text-[10px] font-black text-paper-700">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.actualCost}
                                                            onChange={(e) => {
                                                                const val = Math.max(0, Number(e.target.value) || 0);
                                                                updateItemCost(item.id, item.estimatedCost, val);
                                                            }}
                                                            className="w-12 bg-transparent text-xs font-mono font-black text-paper-900 focus:outline-none text-right"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t-2 border-paper-300 flex items-center justify-between">
                    <p className="text-[11px] text-paper-700 italic">
                        Tip: Edit actual expenses directly in the ledger as you travel to track real-time budget burn.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        className="px-5 py-2.5 bg-paper-900 hover:bg-paper-800 text-paper-50 font-bold text-xs sm:text-sm rounded-xl border border-paper-900 shadow-sm transition"
                    >
                        Close Ledger
                    </button>
                </div>

            </div>
        </div>
    );
};

