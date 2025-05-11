import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {Resizable} from "re-resizable"
import { useState } from "react";

export const TrackRowItem = ({ id, item, onResizeStop, handleDeleteContextMenu, handleOnClickTrackItem}) => {
  const [dragEnable, setDragEnable] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isOver} =
    useSortable({ id, disabled: dragEnable });
  const handleOnResizeStart = (e, dir, ref, d) => {
    console.log("Resize Start:");
  }
  function myHandle(event){
    handleDeleteContextMenu(event, "track-item", {...item})
  }
  const handleOnResizeStop = (e, dir, ref, d) => {
    onResizeStop({...item}, dir, d.width)
  }
  const handleOnClick = () => {
    handleOnClickTrackItem(item)
  }
  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };
  const flag = true;
  return (
  
    <div
      ref={setNodeRef}
      id={id}
      className="bg-white h-full w-fit border rounded flex items-center justify-center text-sm"
      style={{...style, 
      }}
      
    > 
      <Resizable
        size={{ width: `${item.width}px`, height: '100%'}}
        className="flex items-center justify-center"
        enable={{ top:false, 
          right:true, 
          bottom:false,
          left:true, 
          topRight:false, 
          bottomRight:false,
          bottomLeft:false, 
          topLeft:false }}
        maxWidth={item.type === "audio" ? (item.original_duration)*16 : undefined}
        minWidth={48}
        onResizeStart={handleOnResizeStart}
        onResizeStop={handleOnResizeStop}
        handleStyles={{
          top: "",
          left: flag
            ? {
                marginTop: -5,
                marginLeft: 4,
                top: "50%",
                left: 0,
                cursor: "ew-resize",
                border: "3px solid #999",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderWidth: 2,
                borderColor: "#4d4d4d",
                width: 10,
                height: 10,
                boxSizing: "border-box",
                zIndex: 1
              }
            : "",
          bottom: "",
          right: flag
            ? {
                marginTop: -5,
                marginLeft: -14,
                top: "50%",
                left: "100%",
                cursor: "ew-resize",
                border: "3px solid #999",
                borderTop: "none",
                borderLeft: "none",
                borderBottom: "none",
                borderWidth: 2,
                borderColor: "#4d4d4d",
                width: 10,
                height: 10,
                boxSizing: "border-box",
                zIndex: 1
              }
            : ""
        }}
      >
        <div {...attributes}
        {...listeners}
        onDrag={() => setDragEnable(true)}
        onDragEnd={()=>setDragEnable(false)}
        onContextMenu={myHandle} 
        className="truncate px-2 w-[90%] h-full text-center content-center  ">
        {item.type === "image" ? (
          <div className="w-full h-full bg-contain bg-center bg-repeat-x" style={{
            backgroundImage: `url(${item.source})`
          }}></div>
        ): (
            <span className="user-select-none">{item.name}</span>
        )
        }
        </div>
      </Resizable>
    </div>
  );
};
