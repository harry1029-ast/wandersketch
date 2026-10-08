'use client';

import React, { useState, useEffect } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { ExpenseCategory, ItineraryItem } from '@/types/itinerary';
import { saveItineraryItem } from '@/lib/repositories';
import { playChime } from '@/lib/audio';
import {
    X,
    Receipt,
    Bed,
    ForkKnife,
    Ticket,
    Train,
    Check,
    CaretDown,
} from '@phosphor-icons/react';

interface QuickExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetItem: ItineraryItem | null;
    dayNumber: number;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
    isOpen,
    onClose,
    targetItem,
    dayNumber,
}) => {
    const { currentItineraryDays, updateItemCost } = useItineraryStore();

    const currentDay = currentItineraryDays.find((d) => d.dayNumber === dayNumber);
    const dayItems = currentDay?.items || [];

    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [category, setCategory] = useState<ExpenseCategory>('ticket');
    const [actualCost, setActualCost] = useState<string>('');
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    // Sync form state when modal opens or target item changes
    useEffect(() => {
        if (!isOpen) return;

        if (targetItem) {
            setSelectedItemId(targetItem.id);
            setCategory(targetItem.category || 'ticket');
            setEstimatedCost(targetItem.estimatedCost || 0);
            setActualCost(targetItem.actualCost > 0 ? String(targetItem.actualCost) : '');
        } else if (dayItems.length > 0) {
            const first = dayItems[0];
            setSelectedItemId(first.id);
            setCategory(first.category || 'ticket');
            setEstimatedCost(first.estimatedCost || 0);
            setActualCost(first.actualCost > 0 ? String(first.actualCost) : '');
        }
    }, [isOpen, targetItem, dayItems]);

    if (!isOpen) return null;

    const currentSelected = dayItems.find((i) => i.id === selectedItemId) || targetItem;
    const currentName = currentSelected?.name || 'Selected Waypoint';

    const handleItemChange = (itemId: string) => {
        const item = dayItems.find((i) => i.id === itemId);
        if (item) {
            setSelectedItemId(item.id);
            setCategory(item.category || 'ticket');
            setEstimatedCost(item.estimatedCost || 0);
            setActualCost(item.actualCost > 0 ? String(item.actualCost) : '');
        }
    };

    const handleSave = async () => {
        if (!selectedItemId && !targetItem) return;

        const effectiveId = selectedItemId || targetItem?.id || '';
        const parsedActual = parseFloat(actualCost);
        const costToRecord = isNaN(parsedActual) || parsedActual < 0 ? 0 : parsedActual;

        setIsSaving(true);
        try {
            // 1. Update local Zustand state & recalculate ledger
            updateItemCost(effectiveId, estimatedCost, costToRecord, category);

            // 2. Persist to Supabase
            const itemToSave = dayItems.find((i) => i.id === effectiveId) || targetItem;
            if (itemToSave) {
                await saveItineraryItem({
                    ...itemToSave,
                    category,
                    actualCost: costToRecord,
                });
            }

            playChime('stamp');
            onClose();
        } catch (err) {
            console.error('Failed to save expense:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const numActual = parseFloat(actualCost);
    const diff = !isNaN(numActual) ? numActual - estimatedCost : 0;

    const categories: { id: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
        { id: 'lodging', label: 'Lodging', icon: <Bed size={15} weight="bold" /> },
        { id: 'dining', label: 'Dining', icon: <ForkKnife size={15} weight="bold" /> },
        { id: 'ticket', label: 'Ticket', icon: <Ticket size={15} weight="bold" /> },
        { id: 'transit', label: 'Transit', icon: <Train size={15} weight="bold" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-float relative flex flex-col space-y-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-paper-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900">
                            <Receipt size={22} weight="bold" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-paper-700 font-mono">
                                Live Field Ledger · Day {dayNumber}
                            </span>
                            <h3 className="font-serif font-black text-lg text-paper-900 leading-tight">
                                Record Actual Expense
                            </h3>
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

                {/* Waypoint Item Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-paper-800 uppercase tracking-wider font-mono">
                        Itinerary Waypoint
                    </label>
                    {dayItems.length > 1 ? (
                        <div className="relative">
                            <select
                                value={selectedItemId}
                                onChange={(e) => handleItemChange(e.target.value)}
                                className="w-full appearance-none bg-paper-50 border-2 border-paper-900 rounded-2xl py-2.5 px-3.5 pr-8 text-sm font-bold text-paper-900 font-serif shadow-xs focus:outline-none focus:ring-2 focus:ring-watercolor-brick"
                            >
                                {dayItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (${item.estimatedCost})
                                    </option>
                                ))}
                            </select>
                            <CaretDown
                                size={16}
                                weight="bold"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-700 pointer-events-none"
                            />
                        </div>
                    ) : (
                        <div className="p-3 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-xs">
                            <h4 className="font-serif font-black text-sm text-paper-900">{currentName}</h4>
                        </div>
                    )}
                </div>

                {/* Category Pill Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-paper-800 uppercase tracking-wider font-mono">
                        Expense Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {categories.map((cat) => {
                            const isSelected = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        playChime('tap');
                                        setCategory(cat.id);
                                    }}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                                        isSelected
                                            ? 'bg-watercolor-brick text-white shadow-stamp font-black border-2 border-paper-900'
                                            : 'bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300'
                                    }`}
                                >
                                    {cat.icon}
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Amount Input & Reference Badge */}
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-paper-800 uppercase tracking-wider font-mono">
                            Actual Amount Spent
                        </label>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-paper-700">Planned Est:</span>
                            <span className="px-2 py-0.5 rounded-md bg-paper-200 text-paper-900 font-mono text-xs font-black border border-paper-300">
                                ${estimatedCost}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl font-black text-paper-700">
                            $
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={actualCost}
                            onChange={(e) => setActualCost(e.target.value)}
                            autoFocus
                            className="w-full bg-paper-50 border-3 border-paper-900 rounded-2xl py-3 pl-9 pr-4 text-center font-mono font-black text-2xl text-paper-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-watercolor-brick placeholder:text-paper-400"
                        />
                    </div>

                    {/* Cost Difference Badge */}
                    {!isNaN(numActual) && actualCost !== '' && (
                        <div className="flex items-center justify-center pt-1">
                            {diff > 0 ? (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-mono">
                                    +${diff.toFixed(2)} over estimated plan
                                </span>
                            ) : diff < 0 ? (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                                    -${Math.abs(diff).toFixed(2)} under estimated plan
                                </span>
                            ) : (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-mono">
                                    Exact match with estimated budget
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t-2 border-paper-300">
                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-paper-200 hover:bg-paper-300 border-2 border-paper-900 text-paper-900 text-xs font-bold transition shadow-xs"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-watercolor-brick hover:bg-red-800 text-white text-xs font-extrabold border-2 border-paper-900 transition shadow-stamp flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                        <Check size={16} weight="bold" />
                        <span>{isSaving ? 'Syncing...' : 'Save Expense'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

