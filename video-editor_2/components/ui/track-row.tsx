import React from "react";
import {
    SortableContext,
    horizontalListSortingStrategy,
    rectSortingStrategy,
  } from "@dnd-kit/sortable";
  
import { TrackRowItem } from "./track-row-item";
import { useDroppable } from "@dnd-kit/core";

export const TrackRow = ({ tasks, id, onResizeItem }) => {
    const {setNodeRef}  = useDroppable({id})
return (
    <SortableContext id={id} items={tasks} strategy={horizontalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-row h-16 relative min-w-[800px] w-full bg-gray-50">
            {tasks.map((task) => (
                <TrackRowItem onResizeStop={onResizeItem} key={task.id} id={task.id} item={task} />
            ))}
        </div>
    </SortableContext>
);
};
  