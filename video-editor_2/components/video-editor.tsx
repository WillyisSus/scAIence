"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, Scissors, RotateCcw, RotateCw, Eye, Video, Volume, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import AudioPlayer from 'react-h5-audio-player';
import ReactPlayer from 'react-player';

interface VideoEditorProps {
  onCancel?: () => void
}

interface TimelineItem {
  id: string
  name: string
  position: number
  width: number
  type: string
}

interface Track {
  id: number
  type: string
  icon: JSX.Element
  items: TimelineItem[]
}

export default function VideoEditor({ onCancel }: VideoEditorProps) {
  const [currentTime, setCurrentTime] = useState("00:00")
  const [totalTime, setTotalTime] = useState("12:03")
  const [draggingItem, setDraggingItem] = useState<any>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ trackId: number | null; itemId: string | null }>({
    trackId: null,
    itemId: null,
  })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const [draggedItemInfo, setDraggedItemInfo] = useState<{ trackId: number | null; itemId: string | null }>({
    trackId: null,
    itemId: null,
  })

  const [topBarProgress, setTopBarProgress] = useState("")

  const [is_data_loaded, setDataLoaded] = useState(false)
  const [resources, setResources] = useState([])
  const [display_item, setDisplayItem] = useState(null)

  // Reference to track containers for position calculations
  const trackRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Modified tracks structure to support multiple items per position
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 1,
      type: "subtitle",
      icon: <Eye />,
      items: [
        // { id: "subtitle-1", name: "Subtitle 1", position: 10, width: 100, type: "subtitle" },
        // { id: "subtitle-2", name: "Subtitle 2", position: 150, width: 80, type: "subtitle" },
      ],
    },
    // {
    //   id: 2,
    //   type: "overlay",
    //   icon: <Eye />,
    //   items: [
    //     { id: "overlay-1", name: "overlay.mp4", position: 50, width: 120, type: "overlay" },
    //     { id: "overlay-2", name: "overlay2.mp4", position: 200, width: 100, type: "overlay" },
    //   ],
    // },
    {
      id: 3,
      type: "image",
      icon: <Eye />,
      items: [
        // { id: "video-1", name: "video_name.mp4", position: 0, width: 150, type: "video" },
        // { id: "video-2", name: "video3.mp4", position: 180, width: 130, type: "video" },
      ],
    },
    {
      id: 4,
      type: "audio",
      icon: <Eye />,
      items: [
          // { id: "audio-1", name: "audio_1.wav", position: 20, width: 300, type: "audio" }
      ],
    },
  ])

  useEffect(() => {
    const onLoadAssets = async () => {
      if (is_data_loaded) return;

      const response = await fetch('/api/project_init/save_resources', {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })

      if (response.ok){
        const data = await response.json();
        const resource_array = data.output;

        setResources(resource_array);
        setDataLoaded(true)
      }
    }

    onLoadAssets().then()

    return
  }, [])

  // // Sample video resources
  // const resources = [
  //   { id: 1, name: "video_name.mp4", type: "video" },
  //   { id: 2, name: "video3.mp4", type: "video" },
  //   { id: 3, name: "video3.mp4", type: "video" },
  //   { id: 4, name: "video_name.mp4", type: "video" },
  //   { id: 5, name: "video3.mp4", type: "video" },
  //   { id: 6, name: "video3.mp4", type: "video" },
  //   { id: 7, name: "audio_1.wav", type: "audio" },
  //   { id: 8, name: "subtitle.txt", type: "subtitle" },
  //   { id: 9, name: "overlay.mp4", type: "overlay" },
  // ]

  // Function to check if two items overlap
  const checkOverlap = (item1: TimelineItem, item2: TimelineItem) => {
    return item1.position < item2.position + item2.width && item1.position + item1.width > item2.position
  }

  // Function to find a valid position for an item that doesn't overlap with others
  const findValidPosition = (trackId: number, item: TimelineItem, currentPosition: number) => {
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return currentPosition

    // Get all other items in this track
    const otherItems = track.items.filter((i) => i.id !== item.id)

    // If no other items, return the current position
    if (otherItems.length === 0) return currentPosition

    // Check if current position overlaps with any other item
    // const overlappingItems = otherItems.filter((other) => checkOverlap(testItem, other))

    while (true){
      const testItem = { ...item, position: currentPosition }
      const overlappingItem = otherItems.find((other) => checkOverlap(testItem, other))
      if (!overlappingItem){
        // if (currentPosition < 0){
        //   otherItems.forEach((e) => {e.position += item.width})
        // }
        return currentPosition
      }
      // If there's an overlap, position it adjacent to the overlapping item
      // if (currentPosition < overlappingItem.position) {
      //   // Position to the left of the overlapping item
      //   currentPosition = overlappingItem.position - item.width
      // } else {
      //   // Position to the right of the overlapping item
      // }
      currentPosition = overlappingItem.position + overlappingItem.width
    }

  }

  // Handle drag start from resources panel
  const handleDragStart = (e: React.DragEvent, resource: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(resource))
    setDraggingItem(resource)
    // Create a ghost image for dragging
    const ghostElement = document.createElement("div")
    ghostElement.classList.add("bg-primary", "text-white", "p-2", "rounded", "text-sm")
    ghostElement.textContent = resource.name
    document.body.appendChild(ghostElement)
    e.dataTransfer.setDragImage(ghostElement, 0, 0)
    setTimeout(() => {
      document.body.removeChild(ghostElement)
    }, 0)
  }

  // Handle drag over on timeline tracks
  const handleDragOver = (e: React.DragEvent, trackId: number) => {
    e.preventDefault()
    e.currentTarget.classList.add("bg-primary/10")
  }

  // Handle drag leave on timeline tracks
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove("bg-primary/10")
  }

  // Handle drop on timeline tracks - now adds at horizontal position
  const handleDrop = (e: React.DragEvent, trackId: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove("bg-primary/10")

    try {
      // If we're dropping a new resource from the panel
      if (!isDraggingTimeline) {
        const resourceData = JSON.parse(e.dataTransfer.getData("application/json"))
        const trackRect = e.currentTarget.getBoundingClientRect()
        const dropPosition = e.clientX - trackRect.left + e.currentTarget.scrollLeft

        // Create the new item
        const newItem: TimelineItem = {
          id: `${resourceData.type}-${Date.now()}`, // Generate unique ID
          name: resourceData.name,
          position: dropPosition,
          width: 80, // Random width between 80-130px
          type: resourceData.type,
        }

        // Find a valid position that doesn't overlap
        const validPosition = findValidPosition(trackId, newItem, dropPosition)
        newItem.position = validPosition

        // Update the track items - adding at the valid position
        const updatedTracks = tracks.map((track) => {
          if (track.id === trackId) {
            // Make sure we're dropping the right type of resource on the right track
            if (
              (track.type === "image" && resourceData.type === "image") ||
              (track.type === "audio" && resourceData.type === "audio") ||
              (track.type === "subtitle" && resourceData.type === "subtitle")
            ) {
              return {
                ...track,
                items: [...track.items, newItem],
              }
            }
          }
          return track
        })

        setTracks(updatedTracks)
      }
      // If we're moving an existing item on the timeline
      else if (draggedItemInfo.trackId !== null && draggedItemInfo.itemId !== null) {
        const sourceTrackId = draggedItemInfo.trackId
        const itemId = draggedItemInfo.itemId

        // Only allow dropping on the same track type
        const sourceTrack = tracks.find((t) => t.id === sourceTrackId)
        const targetTrack = tracks.find((t) => t.id === trackId)

        if (sourceTrack && targetTrack && sourceTrack.type === targetTrack.type) {
          const item = sourceTrack.items.find((i) => i.id === itemId)

          if (item) {
            const trackRect = e.currentTarget.getBoundingClientRect()
            const dropPosition = e.clientX - trackRect.left + e.currentTarget.scrollLeft - dragOffset.x

            // Find a valid position that doesn't overlap
            const validPosition = findValidPosition(trackId, item, dropPosition)

            // Update the tracks
            const updatedTracks = tracks.map((track) => {
              // Remove from source track
              if (track.id === sourceTrackId) {
                return {
                  ...track,
                  items: track.items.filter((i) => i.id !== itemId),
                }
              }
              // Add to target track
              if (track.id === trackId) {
                const updatedItem = { ...item, position: validPosition }
                return {
                  ...track,
                  items: [...track.items, updatedItem],
                }
              }
              return track
            })

            setTracks(updatedTracks)
          }
        }
      }
    } catch (error) {
      console.error("Error dropping item:", error)
    }

    // Reset dragging state
    setIsDraggingTimeline(false)
    setDraggedItemInfo({ trackId: null, itemId: null })
    // setDraggingItem(null)
  }

  // Handle mouse down on timeline items for dragging
  const handleTimelineItemMouseDown = (e: React.MouseEvent, trackId: number, itemId: string) => {
    e.preventDefault()

    // Find the item
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    const item = track.items.find((i) => i.id === itemId)
    if (!item) return

    // Calculate offset within the item where the mouse was clicked
    const itemElement = e.currentTarget as HTMLElement
    const itemRect = itemElement.getBoundingClientRect()
    const offsetX = e.clientX - itemRect.left

    setDragOffset({ x: offsetX, y: 0 })
    setIsDraggingTimeline(true)
    setDraggedItemInfo({ trackId, itemId })

    // Add event listeners for mouse move and mouse up
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Handle mouse move during timeline item drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingTimeline || draggedItemInfo.trackId === null || draggedItemInfo.itemId === null) return

    const trackId = draggedItemInfo.trackId
    const itemId = draggedItemInfo.itemId

    // Find the track and item
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    const trackElement = trackRefs.current[trackId]
    if (!trackElement) return

    const trackRect = trackElement.getBoundingClientRect()
    const item = track.items.find((i) => i.id === itemId)
    if (!item) return

    // Calculate new position
    const newPosition = e.clientX - trackRect.left - dragOffset.x + trackElement.scrollLeft

    // Find a valid position that doesn't overlap with other items
    const validPosition = findValidPosition(trackId, item, newPosition)

    // Update the item position
    const updatedTracks = tracks.map((t) => {
      if (t.id === trackId) {
        return {
          ...t,
          items: t.items.map((i) => {
            if (i.id === itemId) {
              return { ...i, position: validPosition }
            }
            return i
          }),
        }
      }
      return t
    })

    setTracks(updatedTracks)
  }

  // Handle mouse up after timeline item drag
  const handleMouseUp = () => {
    setIsDraggingTimeline(false)
    setDraggedItemInfo({ trackId: null, itemId: null })
    setDraggingItem(null)

    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  // Handle right click on timeline items
  const handleContextMenu = (e: React.MouseEvent, trackId: number, itemId: string) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setSelectedItem({ trackId, itemId })
    setShowContextMenu(true)
  }

  // Handle delete item
  const handleDeleteItem = () => {
    if (selectedItem.trackId !== null && selectedItem.itemId !== null) {
      const updatedTracks = tracks.map((track) => {
        if (track.id === selectedItem.trackId) {
          return {
            ...track,
            items: track.items.filter((item) => item.id !== selectedItem.itemId),
          }
        }
        return track
      })

      setTracks(updatedTracks)
    }

    setShowContextMenu(false)
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [showContextMenu])

  const loadDataContent = (resource_item) => {
    setDisplayItem(resource_item)
  }

  const onExportVideo = async () => {
    setTopBarProgress("Đang xuất bản...")
    try {
      const response = await fetch("/api/compile_video", {
        method: 'GET',
        headers: {
          'Content-type' : 'application/json'
        }
      })

      setTopBarProgress("Xuất bản thành công.")

    } catch (error) {
      setTopBarProgress("Xuất bản thất bại.")
    }
  }

  return (
    <div className="max-w-full">
      {/* Top toolbar */}
      <div className="flex justify-between p-4 border-b">
        <div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
        </div>
        <div>
          {topBarProgress}
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={onExportVideo}>
          Xuất bản <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-3 border-b">
        {/* Resources panel */}
        <div className="border-r p-4 ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-lg">Tài nguyên</h2>
            <Button variant="ghost" size="icon" className="rounded-full">
              <span className="text-xl">+</span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 overflow-scroll">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col items-center cursor-move"
                draggable
                onDragStart={(e) => handleDragStart(e, resource)}
              >
                <div className="bg-gray-200 w-full aspect-video rounded mb-1 flex items-center justify-center text-xs" onClick={() => {loadDataContent(resource)}}>
                  {resource.type === "audio" ? (
                    <Volume className="h-4 w-4" />
                  ) : resource.type === "subtitle" ? (
                    <span className="break-words block w-full text-ellipsis whitespace-nowrap overflow-hidden mx-4">{resource.source + "drtfyghdjadsyutaduvhbasjkjidu8asy7tdfuasvhdbkjaoiuy"}</span>
                  ) : (
                    <img src={resource.source} className="aspect-video scale-75" alt="Image"/>
                  )}
                </div>
                <span className="text-xs truncate w-full text-center">{resource.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Video player */}
        <div className="border-r p-4">
          <h2 className="font-medium text-lg mb-4">Trình phát</h2>

          <ReactPlayer url={"project2/output_video.mp4"} width="100%"/>

          {/*<div className="flex flex-col h-[calc(100%-6rem)]">*/}
          {/*  <div className="flex-1 bg-gray-100 rounded-md mb-4"></div>*/}
          {/*  <div className="flex justify-between items-center">*/}
          {/*    <div className="flex gap-2">*/}
          {/*      <Button variant="ghost" size="icon">*/}
          {/*        <ChevronRight className="h-5 w-5 rotate-180" />*/}
          {/*      </Button>*/}
          {/*      <Button variant="ghost" size="icon">*/}
          {/*        <span className="h-5 w-5 flex items-center justify-center">⏸️</span>*/}
          {/*      </Button>*/}
          {/*      <Button variant="ghost" size="icon">*/}
          {/*        <ChevronRight className="h-5 w-5" />*/}
          {/*      </Button>*/}
          {/*      <Button variant="ghost" size="icon">*/}
          {/*        <ChevronRight className="h-5 w-5 ml-1" />*/}
          {/*      </Button>*/}
          {/*    </div>*/}
          {/*    <div className="text-sm">*/}
          {/*      {currentTime}/{totalTime}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}
        </div>

        {/* Properties panel */}
        <div className="p-4">
          <h2 className="font-medium text-lg mb-4">Giá trị</h2>
          { !display_item ?
            // ({draggingItem ? (
            //   <div className="p-4 border rounded-md bg-gray-50">
            //     <p className="text-sm font-medium">Kéo tài nguyên vào timeline</p>
            //     <p className="text-xs text-gray-500 mt-1">Thả vào track tương ứng để thêm vào dự án</p>
            //   </div>) : (</>)}
            (<div className="p-4 border rounded-md bg-gray-50 mt-4">
              <p className="text-sm font-medium">Hướng dẫn sử dụng</p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Kéo tài nguyên vào timeline để thêm</li>
                <li>• Kéo tài nguyên trên timeline để di chuyển</li>
                <li>• Click chuột phải vào tài nguyên để xóa</li>
              </ul>
            </div>) :
              display_item.type == "subtitle" ? (<textarea defaultValue={display_item.source}></textarea>) :
              display_item.type == "audio" ? (<AudioPlayer src={display_item.source} onPlay={(e) => {
                    e.preventDefault();
                    console.log("onPlay")
                  }}></AudioPlayer>) :
              display_item.type == "image" ? (<img src={display_item.source} alt={"Image"} className="w-40"/>) : (<br/>)
          }
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {/* Timeline toolbar */}
        <div className="flex items-center border-b p-2 gap-4">
          <Scissors className="h-5 w-5" />
          <div className="border-r h-6 mx-2"></div>
          <Button variant="ghost" size="icon">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>

        {/* Timeline ruler */}
        <div className="flex border-b overflow-x-auto">
          <div className="w-60 border-r flex-shrink-0"></div>
          <div className="flex-1 flex min-w-[800px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-[50px] flex items-center justify-center border-r text-sm py-2">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline tracks */}
        <div className="flex-1 overflow-x-auto">
          {tracks.map((track) => (
            <div key={track.id} className="flex border-b">
              <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
                {track.type === "subtitle" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">T</span>
                    <Eye className="h-5 w-5" />
                  </div>
                ) : track.type === "overlay" ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    <Eye className="h-5 w-5" />
                  </div>
                ) : track.type === "video" ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    <Eye className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Volume className="h-5 w-5" />
                    <Eye className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div
                ref={(el) => (trackRefs.current[track.id] = el)}
                className="flex-1 h-16 relative min-w-[800px] bg-gray-50"
                onDragOver={(e) => handleDragOver(e, track.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, track.id)}
              >
                {track.items.map((item) => (
                  <div
                    key={item.id}
                    className={`absolute top-2 bottom-2 bg-white border rounded flex items-center justify-center text-sm cursor-move ${
                      isDraggingTimeline && draggedItemInfo.itemId === item.id ? "border-primary border-2" : ""
                    }`}
                    style={{
                      left: `${item.position}px`,
                      width: `${item.width}px`,
                    }}
                    onMouseDown={(e) => handleTimelineItemMouseDown(e, track.id, item.id)}
                    onContextMenu={(e) => handleContextMenu(e, track.id, item.id)}
                  >
                    <span className="truncate px-2">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-md border overflow-hidden z-50"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
          }}
        >
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm text-red-600"
            onClick={handleDeleteItem}
          >
            <Trash className="h-4 w-4" />
            <span>Xóa tài nguyên</span>
          </div>
        </div>
      )}
    </div>
  )
}

