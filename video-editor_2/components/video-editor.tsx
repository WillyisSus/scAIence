"use client"

import type React from "react"

import { useState, useEffect, useRef, use } from "react"
import { ChevronRight, Scissors, RotateCcw, RotateCw, Eye, Video, Volume, Trash, PlayCircleIcon, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import AudioPlayer from 'react-h5-audio-player';
import ReactPlayer from 'react-player';
import { Item } from "@radix-ui/react-accordion"
import next from "next"

interface VideoEditorProps {
  onCancel?: () => void
}

interface TimelineItem {
  id: string
  name: string
  source:string
  duration: number
  trim_start: number
  trim_end: number
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
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export default function VideoEditor({ onCancel }: VideoEditorProps) {
  const pxPerSecond = 16;
  const lastFrameTime = useRef(0);
  const frameRef = useRef();
  const [previewPlay, setPreviewPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00")
  const [numericCurrentTime, setNumericCurrentTime] = useState(0);
  const [numericTotalTime, setNumericTotalTime] = useState(0);
  const [totalTime, setTotalTime] = useState("12:03")
  const [draggingItem, setDraggingItem] = useState<any>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ trackId: number | null; itemId: string | null }>({
    trackId: null,
    itemId: null,
  })
  const [totalAudioDuration, setTotalAudioDuration] = useState(0);
  const [outputURL, setOutputURL] = useState("");

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const [draggedItemInfo, setDraggedItemInfo] = useState<{ trackId: number | null; itemId: string | null }>({
    trackId: null,
    itemId: null,
  })
  const [topBarProgress, setTopBarProgress] = useState("")

  const [is_data_loaded, setDataLoaded] = useState(false)
  const [resources, setResources] = useState([])
  const [imageTrackResources, setImageTrackResources] = useState([]);
  const [subtitleTrackResources, setSubtitleTrackResources] = useState([]);
  const [voiceTrackResources, setVoiceTrackResources] = useState([]);
  const [display_item, setDisplayItem] = useState(null)

  // Reference to track containers for position calculations
  const trackRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Modified tracks structure to support multiple items per position
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 1,
      type: "subtitle",
      icon: <Eye />,
      items: [],
    },
    {
      id: 2,
      type: "overlay",
      icon: <Eye />,
      items: [],
    },
    {
      id: 3,
      type: "image",
      icon: <Eye />,
      items: [],
    },
    {
      id: 4,
      type: "audio",
      icon: <Eye />,
      items: [],
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
      let totalDuration = 0.0;
      if (response.ok){
        const data = await response.json();
        const resource_array = data.output;

        setResources(resource_array);
        let timeLineSubtitles = [];
        let timeLineImages = [];
        let timeLineAudio = [];

        resource_array.forEach(items => {
          totalDuration += items.original_duration;
          if (items.type === "subtitle"){
            timeLineSubtitles.push({
              id: timeLineSubtitles.length + 1,
              name: items.name,
              source: items.source,
              duration: items.orginal_duration + 0,
              trim_start: 0,
              trim_end: items.original_duration,
              position: (timeLineSubtitles.length > 0? timeLineSubtitles[timeLineSubtitles.length - 1].position + timeLineSubtitles[timeLineSubtitles.length - 1].width: 0),
              width: (items.original_duration+1) * pxPerSecond,
              type: "subtitle"
            })

          }
          else if (items.type === "image"){
            timeLineImages.push({
              id: timeLineImages.length + 1,
              name: items.name,
              source: items.source,
              duration: items.original_duration*1,
              trim_start: 0,
              trim_end: items.original_duration,
              position: (timeLineImages.length > 0? timeLineImages[timeLineImages.length - 1].position + timeLineImages[timeLineImages.length - 1].width: 0),
              width: (items.original_duration+1) * pxPerSecond,
              type: "image"
            })
    

          }
          else if (items.type === "audio"){
            timeLineAudio.push({
              id: timeLineAudio.length + 1,
              name: items.name,
              source: items.source,
              duration: items.orginal_duration*1,
              trim_start: 0,
              trim_end: items.original_duration,
              position: (timeLineAudio.length > 0? timeLineAudio[timeLineAudio.length - 1].position + timeLineAudio[timeLineAudio.length - 1].width: 0),
              width: (items.original_duration+1) * pxPerSecond,
              type: "audio"
            })

          }
        })
        console.log(totalDuration)
        setTotalAudioDuration(totalDuration)
        setNumericTotalTime(totalDuration)
        setTotalTime(formatTime(totalDuration))
        setImageTrackResources(timeLineImages);
        setSubtitleTrackResources(timeLineSubtitles);
        setVoiceTrackResources(timeLineAudio);
        setTracks([
          {
            id: 1,
            type: "subtitle",
            icon: <Eye />,
            items: timeLineSubtitles,
          },
          {
            id: 2,
            type: "overlay",
            icon: <Eye />,
            items: [],
          },
          {
            id: 3,
            type: "image",
            icon: <Eye />,
            items: timeLineImages,
          },
          {
            id: 4,
            type: "audio",
            icon: <Eye />,
            items: timeLineAudio,
          },]
        );

        setDataLoaded(true)
      }
    }

    onLoadAssets().then()

    return
  }, [])
  
  // Animation for playhead
  useEffect(() => {
    if (!previewPlay) return;
  
    lastFrameTime.current = performance.now(); // reset time to avoid jump
  
    const tick = (now) => {
      const delta = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      setNumericCurrentTime(t => t + delta);
      setCurrentTime(formatTime(numericCurrentTime))
      frameRef.current = requestAnimationFrame(tick);
    };
  
    frameRef.current = requestAnimationFrame(tick);
  
    return () => cancelAnimationFrame(frameRef.current);
  }, [previewPlay]);

  useEffect(() => {
    tracks[2].items.forEach((item : TimelineItem) =>{
      if (numericCurrentTime >= item.position/pxPerSecond && numericCurrentTime <= item.position/pxPerSecond + item.trim_end){
        const playingTime = (numericCurrentTime*pxPerSecond - item.position)/pxPerSecond;
        console.log("On play:", playingTime)
        if (playingTime < item.duration) 
          console.log("Source", item.source)
      }
      
    })
  }, [numericCurrentTime])
  // Function to check if two items overlap
  const checkOverlap = (item1: TimelineItem, item2: TimelineItem) => {
    return item1.position < item2.position + item2.width && item1.position + item1.width > item2.position
  }
  const saveProjectProperties = async ()=>{
     const response = await fetch("/api/video_editor/timelines", {
      method: 'POST',
      headers:{
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        profile: tracks
      })
     })
     if (response.ok){
      const res = await response.json()
        console.log(res)}
      else{
        const res = await response.json()
        console.log(res)
      }
  }
  // Function to find a valid position for an item that doesn't overlap with others
  const findValidPosition = (trackId: number, item: TimelineItem, currentPosition: number) => {
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return currentPosition

    // Get all other items in this track
    const otherItems = track.items.filter((i) => i.id !== item.id)

    // If no other items, return the current position
    if (otherItems.length === 0) return 0;

    // Check if current position overlaps with any other item
    // const overlappingItems = otherItems.filter((other) => checkOverlap(testItem, other))

    while (true){
      const testItem = { ...item, position: currentPosition }
      const overlappingItem = otherItems.find((other) => checkOverlap(testItem, other))
      if (!overlappingItem){
        // if (currentPosition < 0){
        //   otherItems.forEach((e) => {e.position += item.width})
        // }
        let dropLocation = 0;
        otherItems.forEach((item) => {dropLocation += item.width});
        return dropLocation;
      }
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


    console.log("Dragging 1")
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
    console.log(trackId + " " + itemId)
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
          let temp = track.items.filter((item) => item.id !== selectedItem.itemId);
          let track_length = 0;
          for (let i = 0; i < temp.length; i++){
            temp[i].position = track_length;
            track_length += temp[i].width;
          }
          return {
            ...track,
            items: temp,
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
      if (response.ok){
        const returnPackage = await response.json();
        console.log(returnPackage.output);
        setOutputURL(returnPackage.output);
      }
      setTopBarProgress("Xuất bản thành công.")

    } catch (error) {
      setTopBarProgress("Xuất bản thất bại.")
    }
  }

  return (
    <div className="max-w-full max-h-full">
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
        <div className="flex flex-row">
          <Button variant="outline" className="flex btn-dark items-center gap-2" onClick={saveProjectProperties}>
              Lưu dự án <Save className="h-4 w-4" />
            </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={onExportVideo}>
            Xuất bản <ChevronRight className="h-4 w-4" />
          </Button>
          
        </div>
       
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 border-b h-100 max-h-100">
        {/* Resources panel */}
        <div className="border-r p-4 ">
          <div className="flex justify-between items-center mb-4 max-h-80">
            <h2 className="font-medium text-lg">Tài nguyên</h2>
            <Button variant="ghost" size="icon" className="rounded-full">
              <span className="text-xl">+</span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-scroll">
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


          <div className="flex flex-col h-full]">
            {/* <ReactPlayer url={outputURL} width="100%" controls={true}/> */}
            <canvas className="bg-gray-500 w-full"/>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                 <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" onClick={e => setPreviewPlay(!previewPlay)}>
                 <span className="h-5 w-5 flex items-center justify-center">⏸
                  <PlayCircleIcon className="h-5 w-5"></PlayCircleIcon>
                 </span>
                </Button>
                <Button variant="ghost" size="icon">
                 <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-sm">
               {numericCurrentTime}/{totalTime}
              </div>
            </div>
          </div>
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
              display_item.type == "subtitle" ? (<textarea className="w-full h-full max-h-80" defaultValue={display_item.source}></textarea>) :
              display_item.type == "audio" ? (<AudioPlayer src={display_item.source} onPlay={(e) => {
                    e.preventDefault();
                    console.log("onPlay")
                  }}></AudioPlayer>) :
              display_item.type == "image" ? (<img src={display_item.source} alt={"Image"} className="w-40"/>) : (<br/>)
          }
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-row">
        {/* Timeline toolbar and left panel*/}
        <div id="toolbar-leftpanel" className="flex flex-col">
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
          <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-2">
                      <span className="text-xl">T</span>
                      <Eye className="h-5 w-5" />
                    </div>        
          </div>
          <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-2">
                      <span className="text-xl"></span>
                      <Eye className="h-5 w-5" />
                    </div>        
          </div>
          <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-2">
                      <span className="text-xl"></span>
                      <Eye className="h-5 w-5" />
                    </div>        
          </div>
          <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-2">
                      <span className="text-xl"></span>
                      <Eye className="h-5 w-5" />
                    </div>        
          </div>
        </div>
        

        {/* Timeline tracks */}
        <div className="flex-1 min-w-[800px] max-w-full overflow-x-scroll relative">
          <div
            id="playhead"
            className="playhead"
            style={{
              opacity: '0.5',
              left: `${numericCurrentTime * pxPerSecond}px`,
              height: '100%',
              width: '2px',
              background: 'red',
              position: 'absolute',
              zIndex: '10000',
            }} />
          {/* Timeline ruler */}
          <div className="flex border-b max-w-full">
          
            {/* <div className="w-60 border-r flex-shrink-0"></div> */}
            <div className="flex min-w-[800px]">
              {Array.from({ length: totalAudioDuration }).map((_, i) => (
                <div key={i} className="w-[16px] min-w-[16px] small flex items-center justify-center border-r text-sm py-2">
                  {(i) % 10 == 0 ? i  : ""}
                </div>
              ))}
            </div>
          </div>
          {tracks.map((track) => (
            <div key={track.id} className="flex border-b">
              {/* <div className="w-60 border-r p-2 flex items-center justify-center flex-shrink-0">
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
              </div> */}
              <div
                ref={(el) => (trackRefs.current[track.id] = el)}
                className="flex-1 h-16 relative min-w-[800px] max-w-full bg-gray-50"
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
                    // onMouseDown={(e) => handleTimelineItemMouseDown(e, track.id, item.id)}
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

