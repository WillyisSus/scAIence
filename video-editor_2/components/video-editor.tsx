"use client"

import type React from "react"

import { useState, useEffect, useRef, use } from "react"
import { ChevronRight, Scissors, RotateCcw, RotateCw, Eye, Video, Volume, Trash, PlayCircleIcon, Save, PlayIcon, ArrowRightFromLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import AudioPlayer from 'react-h5-audio-player';
import ReactPlayer from 'react-player';
import { Item } from "@radix-ui/react-accordion"
import next from "next"
import {   DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDraggable} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { TrackRow } from "./ui/track-row"
import { resourceUsage } from "process"
import { toast, ToastContainer } from "react-toastify"

interface VideoEditorProps {
  onCancel?: () => void
}

interface TimelineItem {
  id: string
  name: string
  source:string
  original_duration: number
  duration: number
  trim_start: number
  trim_end: number
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
  const trackName = {
    first_track:"subtitle",
    second_track: "overlay",
    third_track: "image",
    fourth_track: "audio"
  }
  const lastFrameTime = useRef(0);
  const frameRef = useRef();
  const [previewPlay, setPreviewPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00")
  const [numericCurrentTime, setNumericCurrentTime] = useState(0);
  const [numericTotalTime, setNumericTotalTime] = useState(1000);
  const [totalTime, setTotalTime] = useState("12:03")
  const [draggingItem, setDraggingItem] = useState<any>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ trackId: number | null; itemId: string | null }>({
    trackId: null,
    itemId: null,
  })
  const [totalAudioDuration, setTotalAudioDuration] = useState(1000);
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
  // Drag drop in track functionality
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [parent, setParent] = useState(null)
  const handleDragStart = (active) => {setActiveDragItem(active.id)}
  const handleDragCancel =  () => {setActiveDragItem(null)}
  function handleDragEnd({active, over}) {
    const overID = over?.id;
    if (!overID) return;
    const overContainer =  over.data.current?.sortable.containerId || over.id
    const activeContainer =  active.data.current?.sortable.containerId
    console.log("drag end over: ", overContainer)
    console.log("drag end active: ", activeContainer)
    if (activeContainer !== overContainer) return
    else {
      const activeIndex = active.data.current.sortable.index
      const overIndex = over.data.current?.sortable.index
      console.log("drag end active index: ", activeIndex)
      console.log("drag end over index: ", overIndex)
      switch(activeContainer){
        case trackName.first_track:{
          setSubtitleTrackResources((subtitleTrackResources) => {
            return arrayMove(subtitleTrackResources, activeIndex, overIndex)
          })
          break
        }
        case trackName.second_track:{
          
          break
        }
        case trackName.third_track:{
          setImageTrackResources((imageTrackResources) => {
            return arrayMove(imageTrackResources, activeIndex, overIndex)
          })
          break
        }
        case trackName.fourth_track:{
          setVoiceTrackResources((voiceTrackResources) => {
            return arrayMove(voiceTrackResources, activeIndex, overIndex)
          })
          break
        }
        default: break
      }
      
    }
    // if (overContainer !== activeContainer){
    //   return
    // }else{
    //   setTasks((tasks) => {
    //     const activeIndex = active.data.current.sortable.index
    //     const overIndex = over.data.current?.sortable.index
    //     return arrayMove(tasks, activeIndex, overIndex)})
    // }
    // addTask("These nut")
    // console.log(tasks)
    // setParent(over.id);
  }
  function handleDragOver({active, over}){
    const overID = over?.id;
    if (!overID) return;
    const overContainer =  over.data.current?.sortable.containerId || over.id
    const activeContainer =  active.data.current?.sortable.containerId
    console.log("drag over over: ", overContainer)
    console.log("drag over active: ", activeContainer)
    if (activeContainer !== overContainer) return

  }
  function handleTrackItemResize(item, direction, delta){
    console.log("Resizable stop: ", delta)
    console.log("Resizable direction: ", direction)
    item.width = item.width + delta
    if (direction === "left"){
      if (item.trim_end - (item.width)/pxPerSecond <= 0){
        item.trim_start = 0;
        item.trim_end = item.trim_start + (item.width)/pxPerSecond
      }else{
        item.trim_start = item.trim_end - (item.width)/pxPerSecond
      }
    }else {
      item.trim_end = item.trim_start + (item.width)/pxPerSecond
    }
    item.duration = item.trim_end - item.trim_start
    if (item.id.indexOf(trackName.first_track) != -1){
        const replaceIndex = subtitleTrackResources.findIndex((element) => item.id === element.id)
        setSubtitleTrackResources((subtitleTrackResources)=>{
          subtitleTrackResources[replaceIndex] = {...item}
          return [...subtitleTrackResources]
        }) 
        
    }else if (item.id.indexOf(trackName.second_track) != -1){

    } else if(item.id.indexOf(trackName.third_track) != -1){
      const replaceIndex = imageTrackResources.findIndex((element) => item.id === element.id)
      setImageTrackResources((imageTrackResources)=>{
        imageTrackResources[replaceIndex] = {...item}
        return [...imageTrackResources]
      }) 
    } else if (item.id.indexOf(trackName.fourth_track) != -1) {
      const replaceIndex = voiceTrackResources.findIndex((element) => item.id === element.id)
      setVoiceTrackResources((voiceTrackResources)=>{
        voiceTrackResources[replaceIndex] = {...item}
        return [...voiceTrackResources]
      }) 
    }
  }
  // Drag drop in track
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
  // Fetch timelines
  useEffect(()=>{
    const onLoadTimelines = async ()=>{
      const timelineRequest = await fetch('/api/video_editor/timelines', {
        method: 'GET',
        headers: {
          'Content-type': 'application/json' 
        }
      })
      if (timelineRequest.status === 200){
        const timelineOutput = await timelineRequest.json()
        const timelineTracks = JSON.parse(timelineOutput.output);
        console.log(timelineTracks)
        try{
          timelineTracks.forEach(element => {
            if (element?.type === trackName.first_track){
              setSubtitleTrackResources(element.items)
            }else if (element?.type === trackName.second_track){
              
            }else if (element?.type === trackName.third_track){
              setImageTrackResources(element.items)
            } else if (element?.type === trackName.fourth_track){
              setVoiceTrackResources(element.items)
            }
          });
        }catch (err){
          console.log(err)
        }
        
      }else{
        const response = await fetch('/api/project_init/save_resources', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json'
          }
        })
        if (response.ok){
          const data = await response.json()
          const resource_array = data.output;
          console.log(resource_array)
          let timeLineSubtitles = [];
          let timeLineImages = [];
          let timeLineAudio = [];
          resource_array.forEach(items => {
            const newItem = {...items}
            console.log(newItem)
            if (items.type === "subtitle"){
              timeLineSubtitles.push({
                id: newItem.type + "_" + timeLineSubtitles.length + 1,
                name: newItem.name,
                source: newItem.source,
                original_duration: newItem.original_duration*1,
                duration: newItem.original_duration*1,
                trim_start: 0,
                trim_end: newItem.original_duration,
                width: (newItem.original_duration+1) * pxPerSecond,
                type: "subtitle"
              })
    
            }
            else if (items.type === "image"){
              timeLineImages.push({
                id: newItem.type + "_" + timeLineImages.length + 1,
                name: newItem.name,
                source: newItem.source,
                original_duration: newItem.original_duration*1,
                duration: newItem.original_duration*1,
                trim_start: 0,
                trim_end: newItem.original_duration,
                width: (newItem.original_duration+1) * pxPerSecond,
                type: "image"
              })
      
    
            }
            else if (items.type === "audio"){
              timeLineAudio.push({
                id: newItem.type + "_" + timeLineAudio.length + 1,
                name: newItem.name,
                source: newItem.source,
                original_duration: newItem.original_duration*1,
                duration: newItem.original_duration*1,
                trim_start: 0,
                trim_end: newItem.original_duration,
                width: (newItem.original_duration+1) * pxPerSecond,
                type: "audio"
              })
    
            }
          })
          setImageTrackResources(timeLineImages);
          setSubtitleTrackResources(timeLineSubtitles);
          setVoiceTrackResources(timeLineAudio);
        }
        }
        
    }
    onLoadTimelines().then()
    return
  }, [])
  // Animation for playhead


  // useEffect(() => {
  //   tracks[2].items.forEach((item : TimelineItem) =>{
  //     if (numericCurrentTime >= item.position/pxPerSecond && numericCurrentTime <= item.position/pxPerSecond + item.trim_end){
  //       const playingTime = (numericCurrentTime*pxPerSecond - item.position)/pxPerSecond;
  //       console.log("On play:", playingTime)
  //       if (playingTime < item.duration) 
  //         console.log("Source", item.source)
  //     }
      
  //   })
  // }, [numericCurrentTime])
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
      profile: [ {
        type: trackName.first_track,
        items: subtitleTrackResources,
      },
      {
        type: trackName.second_track,
        items: [],
      },
      {
        type: trackName.third_track,
        items: imageTrackResources,
      },
      {
        type: trackName.fourth_track,
        items: voiceTrackResources,
      }]
    })
    })
    if (response.ok){
      toast.success("Đã lưu dự án")

      const res = await response.json()
      console.log(res)}
    else{
      toast.error("Không thể lưu dự án")
      const res = await response.json()
      console.log(res)
    }
  }

  const saveProjectAndShowPreview = async ()=>{
      await saveProjectProperties().then()
      let totalFirstTrack = 0;
      let totalThirdTrack = 0;
      let totalFourthTrack = 0
      subtitleTrackResources.forEach((el) => totalFirstTrack += el.duration)
      imageTrackResources.forEach((el) => totalThirdTrack += el.duration)
      voiceTrackResources.forEach((el) => totalFourthTrack += el.duration)
      if (!(totalFirstTrack == totalFourthTrack && totalFirstTrack == totalThirdTrack)){
        toast.warning("Độ dài các timeline không bằng nhau")
        return
      }
      const response = await fetch("/api/video_editor/preview", {
        method: 'GET',
        headers: {
          "Content-type":"application/json"
        }
      })
      if (response.ok){
        const data = await response.json();
        const previewURL = data.output
        console.log(previewURL)
        setOutputURL(previewURL)
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
    await saveProjectProperties().then()
    let totalFirstTrack = 0;
    let totalThirdTrack = 0;
    let totalFourthTrack = 0
    subtitleTrackResources.forEach((el) => totalFirstTrack += el.duration)
    imageTrackResources.forEach((el) => totalThirdTrack += el.duration)
    voiceTrackResources.forEach((el) => totalFourthTrack += el.duration)
    if (!(totalFirstTrack == totalFourthTrack && totalFirstTrack == totalThirdTrack)){
      toast.warning("Độ dài các timeline không bằng nhau")
      return
    }

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
          <Button variant="outline" className="flex btn-dark items-center gap-2" onClick={saveProjectAndShowPreview}>
              Xem trước <PlayIcon className="h-4 w-4" />
            </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={onExportVideo}>
            Xuất bản <ArrowRightFromLine className="h-4 w-4" />
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
            <ReactPlayer url={outputURL} width="100%" controls={true}/>
            {/* <canvas className="bg-gray-500 w-full"/>
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
            </div> */}
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
        <div className="flex-1 min-w-[800px] max-w-full bg-gray-50 overflow-x-scroll relative">
        
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
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            onDragOver={handleDragOver}>
            <TrackRow
                id={trackName.first_track}
                tasks={subtitleTrackResources}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                id={trackName.second_track}
                tasks={[]}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                id={trackName.third_track}
                tasks={imageTrackResources}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                  id={trackName.fourth_track}
                  tasks={voiceTrackResources}
                  onResizeItem={handleTrackItemResize}>
              </TrackRow>
            
          </DndContext>
          
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
      <ToastContainer autoClose={2000} position="bottom-center"/>
    </div>
  )
}

