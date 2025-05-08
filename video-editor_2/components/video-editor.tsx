"use client"

import type React from "react"

import { useState, useEffect, useRef, use } from "react"
import { ChevronRight, Scissors, RotateCcw, RotateCw, Eye, Video, Volume, Trash, PlayCircleIcon, Save, PlayIcon, ArrowRightFromLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import AudioPlayer from 'react-h5-audio-player';
import ReactPlayer from 'react-player';
import { signIn, signOut, useSession} from 'next-auth/react';
import axios from "axios";
import {Input} from "@/components/ui/input";
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
import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

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
  xfadeTransition: string
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
  const MENU_ID = "delete-context-menu"
  const MENU_ID_2 = "add-context-menu"
  const maxSubtitleID = useRef(0);
  const maxImageID = useRef(0);
  const maxAudioID = useRef(0);
  const {show} = useContextMenu()
  const lastFrameTime = useRef(0);

  const frameRef = useRef();
  const [previewPlay, setPreviewPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00")
  const [numericCurrentTime, setNumericCurrentTime] = useState(0);
  const [numericTotalTime, setNumericTotalTime] = useState(1000);
  const [totalTime, setTotalTime] = useState("12:03")
  const [draggingItem, setDraggingItem] = useState<any>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({x: 0, y: 0})
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
  const [shareDropdown, setShareDropdown] = useState(false)

  const [is_data_loaded, setDataLoaded] = useState(false)
  const [resources, setResources] = useState([])
  const [imageTrackResources, setImageTrackResources] = useState([]);
  const [subtitleTrackResources, setSubtitleTrackResources] = useState([]);
  const [voiceTrackResources, setVoiceTrackResources] = useState([]);
  const [display_item, setDisplayItem] = useState(null)

  const [outputQuality, setOutputQuality] = useState(1);

  // Reference to track containers for position calculations
  const trackRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  const {data: session, update} = useSession();

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
              maxSubtitleID.current = element.maxID
              setSubtitleTrackResources(element.items)
            }else if (element?.type === trackName.second_track){

            }else if (element?.type === trackName.third_track){
              maxImageID.current = element.maxID
              setImageTrackResources(element.items)
            } else if (element?.type === trackName.fourth_track){
              maxAudioID.current = element.maxID
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
                width: (newItem.original_duration) * pxPerSecond,
                type: "subtitle",
                xfadeTransition: ""
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
                width: (newItem.original_duration) * pxPerSecond,
                type: "image",
                xfadeTransition: ""
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
                width: (newItem.original_duration) * pxPerSecond,
                type: "audio",
                xfadeTransition: ""
              })

            }
          })
          maxImageID.current = timeLineImages.length;
          maxAudioID.current = timeLineAudio.length;
          maxSubtitleID.current = timeLineSubtitles.length;
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

  // Function to check if two items overlap
  const checkOverlap = (item1: TimelineItem, item2: TimelineItem) => {
    return item1.position < item2.position + item2.width && item1.position + item1.width > item2.position
  }
  // Add Remove into from timelines
  function handleContextMenu(event, menuType, item){
    let menuID = ""
    switch(menuType){
      case "delete":
          menuID = MENU_ID
          break
      case "add":
          menuID = MENU_ID_2
    }
    show({
      id: menuID,
      event,
      props: {
          key: item
      }
    })
  }

  function handleShowAddMenu(event){
    const id = event.currentTarget.id
    const index = resources.findIndex((el) => el.id == id)
    const newItem = resources[index]
    handleContextMenu(event, "add", {...newItem})
  }
  const handleItemClick = ({ id, event, props }) => {
    switch (id) {
      case "delete":{
        console.log(event, props)
        const deletedItem = props.key;
        if (deletedItem.id.indexOf(trackName.first_track) != -1){
          const removeIndex = subtitleTrackResources.findIndex((element) => deletedItem.id === element.id)
          setSubtitleTrackResources((subtitleTrackResources)=>{
            subtitleTrackResources.splice(removeIndex, 1)
            return [...subtitleTrackResources]
          })

        }else if (deletedItem.id.indexOf(trackName.second_track) != -1){

        } else if(deletedItem.id.indexOf(trackName.third_track) != -1){
          const removeIndex = imageTrackResources.findIndex((element) => deletedItem.id === element.id)
          setImageTrackResources((imageTrackResources)=>{
            imageTrackResources.splice(removeIndex, 1)
            return [...imageTrackResources]
          })
        } else if (deletedItem.id.indexOf(trackName.fourth_track) != -1) {
          const removeIndex = voiceTrackResources.findIndex((element) => deletedItem.id === element.id)
          setVoiceTrackResources((voiceTrackResources)=>{
            voiceTrackResources.splice(removeIndex, 1)
            return [...voiceTrackResources]
          })
        }
        toast.success("Đã xóa tài nguyên")
        break;
      }
      case "add":{
        const newItem = props.key
        if (newItem.type === "subtitle"){
          const foundIndex = subtitleTrackResources.findIndex((el) => el.name == newItem.name)
          if (foundIndex != -1) {
            toast.error("Đã có tài nguyên")
            break
          }
          subtitleTrackResources.push({
            id: newItem.type + "_" + maxSubtitleID.current + 1,
            name: newItem.name,
            source: newItem.source,
            original_duration: newItem.original_duration*1,
            duration: newItem.original_duration*1,
            trim_start: 0,
            trim_end: newItem.original_duration,
            width: (newItem.original_duration) * pxPerSecond,
            type: "subtitle",
            xfadeTransition: ""
          })
          setSubtitleTrackResources([...subtitleTrackResources])
          maxSubtitleID.current++
        }
        else if (newItem.type === "image"){
          const foundIndex = imageTrackResources.findIndex((el) => el.name == newItem.name)
          if (foundIndex != -1) {
            toast.error("Đã có tài nguyên")
            break
          }
          imageTrackResources.push({
            id: newItem.type + "_" + maxImageID.current + 1,
            name: newItem.name,
            source: newItem.source,
            original_duration: newItem.original_duration*1,
            duration: newItem.original_duration*1,
            trim_start: 0,
            trim_end: newItem.original_duration,
            width: (newItem.original_duration) * pxPerSecond,
            type: "image",
            xfadeTransition: ""
          })
          setImageTrackResources([...imageTrackResources])
          maxImageID.current++

        }
        else if (newItem.type === "audio"){
          const foundIndex = voiceTrackResources.findIndex((el) => el.name == newItem.name)
          if (foundIndex != -1) {
            toast.error("Đã có tài nguyên")
            break
          }
          voiceTrackResources.push({
            id: newItem.type + "_" + maxAudioID.current + 1,
            name: newItem.name,
            source: newItem.source,
            original_duration: newItem.original_duration*1,
            duration: newItem.original_duration*1,
            trim_start: 0,
            trim_end: newItem.original_duration,
            width: (newItem.original_duration) * pxPerSecond,
            type: "audio",
            xfadeTransition: ""
          })
          setVoiceTrackResources([...voiceTrackResources])
          maxAudioID.current++
        }
        toast.success("Đã thêm tài nguyên")
        break
      }
      default: break
      //etc...
    }
  }
  const trackName = {
    first_track:"subtitle",
    second_track: "overlay",
    third_track: "image",
    fourth_track: "audio"
  }
  const saveProjectProperties = async ()=>{
    const response = await fetch("/api/video_editor/timelines", {
    method: 'POST',
    headers:{
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      profile: [ {
        maxID: maxSubtitleID.current,
        type: trackName.first_track,
        items: subtitleTrackResources,
      },
      {
        maxID: 0,
        type: trackName.second_track,
        items: [],
      },
      {
        maxID: maxImageID.current,
        type: trackName.third_track,
        items: imageTrackResources,
      },
      {
        maxID: maxAudioID.current,
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
      // let totalFirstTrack = 0;
      // let totalThirdTrack = 0;
      // let totalFourthTrack = 0
      // subtitleTrackResources.forEach((el) => totalFirstTrack += el.duration)
      // imageTrackResources.forEach((el) => totalThirdTrack += el.duration)
      // voiceTrackResources.forEach((el) => totalFourthTrack += el.duration)
      // if (!(totalFirstTrack == totalFourthTrack && totalFirstTrack == totalThirdTrack)){
      //   toast.warning("Độ dài các timeline không bằng nhau")
      //   return
      // }
      const response = await fetch("/api/compile_video", {
          method: 'POST',
          headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          resX: 854,
          resY: 480,
          sampleRate: 22050,
          crf: 30,
          preset: "ultrafast"
        })
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

    while (true) {
      const testItem = {...item, position: currentPosition}
      const overlappingItem = otherItems.find((other) => checkOverlap(testItem, other))
      if (!overlappingItem) {
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
    // let totalFirstTrack = 0;
    // let totalThirdTrack = 0;
    // let totalFourthTrack = 0
    // subtitleTrackResources.forEach((el) => totalFirstTrack += el.duration)
    // imageTrackResources.forEach((el) => totalThirdTrack += el.duration)
    // voiceTrackResources.forEach((el) => totalFourthTrack += el.duration)
    // if (!(totalFirstTrack == totalFourthTrack && totalFirstTrack == totalThirdTrack)){
    //   toast.warning("Độ dài các timeline không bằng nhau")
    //   return
    // }

    setTopBarProgress("Đang xuất bản...")
    await saveProjectProperties()
    try {
      let resX = 1920
      let resY = 1080
      let sampleRate = 48000
      let crf = 20
      let preset = "slower"
      if (outputQuality == 1) {
        resX = 1280
        resY = 720
        sampleRate = 24000
        crf = 26
        preset = "veryfast"
      } else if (outputQuality == 2) {
        sampleRate = 44100
        crf = 23
        preset = "medium"
      }
      const response = await fetch("/api/compile_video", {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          resX: resX,
          resY: resY,
          sampleRate: sampleRate,
          crf: crf,
          preset: preset
        })
      })
      if (response.ok){
        const returnPackage = await response.json();
        console.log(returnPackage.output);
        setOutputURL(returnPackage.output);
      }
      setTopBarProgress("Xuất bản thành công.")
      setShareDropdown(true)
    } catch (error) {
      setTopBarProgress("Xuất bản thất bại.")
    }
  }

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data === "auth-success") {
        await update();
        console.log(session)
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler); // clean up
  }, [update]);


  const userSignIn = async (provider) => {
    const result = await signIn(`${provider}`, {
      callbackUrl: "/auth-complete",
      redirect: false,
    });
    if (result?.url) {
      window.open(result.url, "_blank", "width=600,height=700");
    }
  }

  const userSignOut = async () => {
    const result = await signOut({
      callbackUrl: "/auth-complete",
      redirect: false,
    });
    if (result?.url) {
      window.open(result.url, "_blank", "width=600,height=700");
    }
  }

  const [selectedProvider,  setSelectedProvider] = useState("")
  const [selectedPage, setSelectedPage] = useState(null)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const [dialogError, setDialogError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const facebookItemClick = async (page) => {
    setSelectedPage(page)
    setSelectedProvider("facebook")
    setOpen(true)
    const response = await axios.post('/api/auth/get_facebook_view', {
      videoId: "981835267445768",
      pageAccessToken: session.pages.find(paged => paged.id === "597796793425257")?.access_token
    });
    const data = response.data;
    console.log(data);
  }

  const googleItemClick = async () => {
    setSelectedProvider("google")
    setOpen(true)
    const response = await axios.post('/api/auth/get_youtube_view', {
      videoId: "ActBtBjnjxY",
      accessToken: session.googleAccessToken,
    });
    const data = response.data;
    console.log(data);
  }

  const handleConfirm = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setDialogError("Vui lòng nhập tiêu đề và mô tả.")
      return
    }
    setIsSubmitting(true)
    try {
      if (selectedProvider === "facebook") {
        const response = await axios.post('/api/auth/upload_facebook', {
          pageId: selectedPage.id,
          pageAccessToken: selectedPage.access_token,
          title: formData.title,
          description: formData.description,
        });
        const data = response.data;
        console.log(data);
        alert("Đăng lên Facebook thành công!")
      } else if (selectedProvider === "google") {
        const response = await axios.post('/api/auth/upload_youtube', {
          channelId: session.googleUserId,
          accessToken: session.googleAccessToken,
          title: formData.title,
          description: formData.description
        });
        const data = response.data;
        console.log(data);
        alert("Đăng lên Youtube thành công!")
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Upload failed';
      console.error("Lỗi khi upload:", errMsg);
      alert("Đăng lên thất bại.")
    }
    setDialogError("")
    setOpen(false)
    setFormData({ title: "", description: "" })
    setIsSubmitting(false)
    setSelectedProvider("")
  }

  return (

    <div className="max-w-full max-h-full">
      <div>
        <Menu id={MENU_ID}>
          <Item id="delete" onClick={handleItemClick}>Xóa tài nguyên</Item>
        </Menu>
        <Menu id={MENU_ID_2}>
          <Item id="add" onClick={handleItemClick}>Thêm vào Timeline</Item>
        </Menu>
      </div>
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
        { shareDropdown && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Chia sẻ <ChevronRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-4">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Facebook</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    { !session ? (
                      <DropdownMenuItem onClick={() => userSignIn("facebook")}>
                        Đăng nhập
                      </DropdownMenuItem>
                    ) : (
                        <>
                        { !session.facebookAccessToken ? (
                          <DropdownMenuItem onClick={() => userSignIn("facebook")}>
                            Chuyển tài khoản
                          </DropdownMenuItem>
                        ) : (
                            <>
                            { session.pages?.map((page : any) => (
                            <DropdownMenuItem key={page.id} onClick={() => facebookItemClick(page)}>
                              {page.name}
                            </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => userSignOut()}>
                              Đăng xuất
                            </DropdownMenuItem>
                            </>
                        )}
                        </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Youtube</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    { !session ? (
                        <DropdownMenuItem onClick={() => userSignIn("google")}>
                          Đăng nhập
                        </DropdownMenuItem>
                    ) : (
                        <>
                          { !session.googleAccessToken ? (
                              <DropdownMenuItem onClick={() => userSignIn("google")}>
                                Chuyển tài khoản
                              </DropdownMenuItem>
                          ) : (
                              <>
                                <DropdownMenuItem onClick={googleItemClick}>
                                  {session.user.name}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => userSignOut()}>
                                  Đăng xuất
                                </DropdownMenuItem>
                              </>
                          )}
                        </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="[&>button.absolute.top-4.right-4]:hidden"
                         onInteractOutside={(e) => e.preventDefault()}
                         onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              {selectedProvider === "facebook" && (
                  <DialogTitle>Chia sẻ lên {selectedPage?.name}</DialogTitle>
              )}
              {selectedProvider === "google" && (
                  <DialogTitle>Chia sẻ lên {session.user.name}</DialogTitle>
              )}
            </DialogHeader>
            <div className="space-y-4 py-4">
              {dialogError && <p className="text-sm text-red-500">{dialogError}</p>}
              <Input
                  placeholder="Tiêu đề"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                  placeholder="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleConfirm} disabled={isSubmitting}>Xác nhận</Button>
              <DialogClose asChild>
                <Button variant="ghost" disabled={isSubmitting}>Hủy</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex flex-row gap-2">
          <Button variant="outline" className="flex btn-dark items-center gap-2" onClick={saveProjectProperties}>
            Lưu dự án <Save className="h-4 w-4"/>
          </Button>
          <Button variant="outline" className="flex btn-dark items-center gap-2" onClick={saveProjectAndShowPreview}>
            Xem trước <PlayIcon className="h-4 w-4"/>
          </Button>
          <select className="w-full p-2 border border-black rounded pr-10" onChange={event => {
            setOutputQuality(event.target.value)
          }} value={outputQuality}>
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2" onClick={onExportVideo}>
            Xuất bản <ArrowRightFromLine className="h-4 w-4"/>
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
                id={resource.id}
                className="flex flex-col items-center cursor-move"
                onContextMenu={handleShowAddMenu}
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
                handleDeleteContextMenu={handleContextMenu}
                id={trackName.first_track}
                tasks={subtitleTrackResources}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                handleDeleteContextMenu={handleContextMenu}
                id={trackName.second_track}
                tasks={[]}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                handleDeleteContextMenu={handleContextMenu}
                id={trackName.third_track}
                tasks={imageTrackResources}
                onResizeItem={handleTrackItemResize}>
              </TrackRow>
            <TrackRow
                handleDeleteContextMenu={handleContextMenu}
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

