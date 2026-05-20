'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Item {
  id: string;
  [k: string]: any;
}

interface Props<T extends Item> {
  items: T[];
  onReorder: (newOrder: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
}

export default function SortableList<T extends Item>({
  items,
  onReorder,
  renderItem,
}: Props<T>) {
  const [local, setLocal] = useState(items);

  // Re-sync when parent items change
  if (local.length !== items.length || local.some((l, i) => l.id !== items[i]?.id)) {
    setLocal(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = local.findIndex((i) => i.id === active.id);
    const newIndex = local.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(local, oldIndex, newIndex);
    setLocal(reordered);
    onReorder(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={local.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {local.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}
