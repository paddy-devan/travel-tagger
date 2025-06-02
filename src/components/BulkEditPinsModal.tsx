'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PIN_CATEGORIES } from '@/lib/constants';

// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

// Drag and drop imports
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Pin {
  id: string;
  nickname: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  trip_id: string;
  google_maps_id: string | null;
  visited_flag: boolean;
  category: string | null;
  created_at: string;
  order: number;
}

interface BulkEditPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSave?: () => void;
}

// Sortable row component for drag and drop
function SortableRow({ 
  row, 
  children 
}: { 
  row: any; 
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
    id: row.original.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'opacity-50 bg-blue-50 shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </tr>
  );
}

export default function BulkEditPinsModal({ 
  isOpen, 
  onClose, 
  tripId, 
  onSave 
}: BulkEditPinsModalProps) {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop sensor
  const sensors = useSensors(useSensor(PointerSensor));

  // Update function for cell editing
  const updatePin = (rowIndex: number, columnId: string, value: any) => {
    setPins(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  // Column definitions using TanStack Table
  const columns = useMemo<ColumnDef<Pin, any>[]>(() => [
    {
      id: 'dragHandle',
      header: () => (
        <div className="text-center text-gray-500 font-normal">⋮⋮</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
            aria-label="Drag to reorder"
            type="button"
            // Note: drag attributes will be applied by SortableRow
          >
            <svg viewBox="0 0 20 20" width="16" fill="currentColor">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
            </svg>
          </button>
        </div>
      ),
      size: 50,
      enableResizing: false,
    },
    {
      accessorKey: 'order',
      header: '#',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 font-medium">
          {(getValue() as number) + 1}
        </span>
      ),
      size: 60,
      enableResizing: false,
    },
    {
      accessorKey: 'nickname',
      header: 'Name',
      cell: ({ getValue, row, column }) => (
        <input
          type="text"
          value={getValue() as string}
          onChange={(e) => updatePin(row.index, column.id, e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     transition-colors"
          placeholder="Enter pin name..."
        />
      ),
      size: 200,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue, row, column }) => (
        <select
          value={getValue() as string || ''}
          onChange={(e) => updatePin(row.index, column.id, e.target.value || null)}
          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     transition-colors"
        >
          <option value="">-- Select Category --</option>
          {PIN_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      ),
      size: 150,
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ getValue, row, column }) => (
        <textarea
          value={getValue() as string || ''}
          onChange={(e) => updatePin(row.index, column.id, e.target.value || null)}
          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     transition-colors resize-none"
          rows={2}
          placeholder="Add notes..."
        />
      ),
      size: 250,
    },
    {
      accessorKey: 'visited_flag',
      header: () => (
        <div className="text-center">Visited</div>
      ),
      cell: ({ getValue, row, column }) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={getValue() as boolean}
            onChange={(e) => updatePin(row.index, column.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 
                       focus:ring-2 transition-colors"
          />
        </div>
      ),
      size: 80,
      enableResizing: false,
    },
  ], []);

  // Create table instance
  const table = useReactTable({
    data: pins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: updatePin,
    },
  });

  // Fetch pins when modal opens
  useEffect(() => {
    if (isOpen && user && tripId) {
      fetchPins();
    }
  }, [isOpen, user, tripId]);

  const fetchPins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('trip_id', tripId)
        .order('order', { ascending: true });
      
      if (error) throw error;
      setPins(data || []);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pins.findIndex((p) => p.id === active.id);
      const newIndex = pins.findIndex((p) => p.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update - immediately update UI
      const updatedPins = arrayMove(pins, oldIndex, newIndex);
      const reorderedPins = updatedPins.map((pin, index) => ({ ...pin, order: index }));
      setPins(reorderedPins);

      // Save to database
      try {
        const { error } = await supabase.rpc('reorder_pin', {
          moved_pin_id: String(active.id),
          new_parent_id: null,
          new_order_index: newIndex
        });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error saving pin order:', error);
        setError('Failed to save new order. Reverting changes.');
        // Revert on error
        fetchPins();
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update all pins in batch (including any reordering that happened)
      for (const pin of pins) {
        const { error } = await supabase
          .from('pins')
          .update({
            nickname: pin.nickname,
            notes: pin.notes,
            category: pin.category,
            visited_flag: pin.visited_flag,
            order: pin.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', pin.id);
        
        if (error) throw error;
      }

      onSave?.();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Pins</h2>
            {pins.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {pins.length} pins
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)] bg-gray-50">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 mt-2">Loading pins...</p>
            </div>
          ) : pins.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No pins found</h3>
              <p className="text-gray-600">This trip doesn't have any pins to edit yet.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              style={{ width: header.getSize() }}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())
                              }
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <SortableContext 
                      items={pins.map(p => p.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="bg-white divide-y divide-gray-200">
                        {table.getRowModel().rows.map(row => (
                          <SortableRow key={row.id} row={row}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </SortableRow>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </div>
              </div>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {pins.length > 0 && (
              <p>Drag rows to reorder • Edit cells directly • Changes are saved together</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md 
                         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                         transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || pins.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 