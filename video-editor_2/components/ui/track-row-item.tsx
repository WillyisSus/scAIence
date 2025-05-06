import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


export const TrackRowItem = ({ id, item }) => {
  const { attributes, listeners, setNodeRef, transform, transition} =
    useSortable({ id });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      id={id}
      className="bg-white h-full border rounded flex items-center justify-center text-sm cursor-move"
      style={{...style, 
        width: `${item.width}px`,
      }}
      {...attributes}
      {...listeners}
    >
      <span className="truncate px-2">{item.name}</span>
    </div>
  );
};
