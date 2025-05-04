"use client"

import {useEffect, useState} from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { ToastContainer, toast } from 'react-toastify';
import ReactModal from "react-modal";


interface DashboardProps {
  onCreateVideo: () => void
  onGoToProject: () => void
}

export default function Dashboard({ onCreateVideo, onGoToProject }: DashboardProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectNameValue, setProjectNameValue] = useState("temp");
  const [is_data_loaded, setDataLoaded] = useState(false)
  const [projectList, setProjectList] = useState([]);

  const handleClose = () => setShowCreateModal(false);
  const handleShow = () => setShowCreateModal(true);


  useEffect(() => {
    const onLoadAssets = async () => {
      if (is_data_loaded) return;

      const response = await fetch('/api/project_init/select_index', {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json();
        setProjectList(data.output);
        setDataLoaded(true)
      }
    }

    onLoadAssets().then()

    return
  }, [])

  // const videos = [
  //   {
  //     id: "vid1",
  //     name: "vid1",
  //     thumbnail: "/placeholder.svg?height=50&width=100",
  //     status: "Đã xuất bản",
  //     date: "10 ngày trước",
  //   },
  //   {
  //     id: "vid2",
  //     name: "vid2",
  //     thumbnail: "/placeholder.svg?height=50&width=100",
  //     status: "Đang xử lí",
  //     date: "10 ngày trước",
  //   },
  //   {
  //     id: "vid3",
  //     name: "vid3",
  //     thumbnail: "/placeholder.svg?height=50&width=100",
  //     status: "Đang xử lí",
  //     date: "8 ngày trước",
  //   },
  // ]

  // const toggleSelectVideo = (videoId: string) => {
  //   if (selectedVideos.includes(videoId)) {
  //     setSelectedVideos(selectedVideos.filter((id) => id !== videoId))
  //   } else {
  //     setSelectedVideos([...selectedVideos, videoId])
  //   }
  // }
  //
  // const toggleSelectAll = () => {
  //   if (selectedVideos.length === videos.length) {
  //     setSelectedVideos([])
  //   } else {
  //     setSelectedVideos(videos.map((video) => video.id))
  //   }
  // }

  const initProject = async () => {
    const response = await fetch('/api/project_init/create_index', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        project_name: projectNameValue
      })
    })

    if (response.ok){
      toast.success("Create project successfully");
      return true;
    }
  }

  const selectProject = async (selectedProjectName : string) => {
    const response = await fetch('/api/project_init/select_index', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        project_name: selectedProjectName
      })
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="default" className="flex items-center gap-2 bg-black text-white" onClick={handleShow}>
            <Plus className="h-5 w-5" />
            Tạo video
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">
                <div className="flex items-center gap-2">
                  {/*<div*/}
                  {/*  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer ${*/}
                  {/*    selectedVideos.length === videos.length ? "bg-black" : "bg-white"*/}
                  {/*  }`}*/}
                  {/*  onClick={toggleSelectAll}*/}
                  {/*>*/}
                  {/*  {selectedVideos.length === videos.length && <Check className="h-4 w-4 text-white" />}*/}
                  {/*</div>*/}
                  Tên video
                </div>
              </th>
              <th className="p-4 text-left">Bản xem trước</th>
              <th className="p-4 text-left">Trạng thái</th>
              <th className="p-4 text-left">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {projectList.map((video) => (
              <tr key={video} className="border-b" onClick={async () => {
                await selectProject(video);
                onGoToProject();
              }}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/*<div*/}
                    {/*  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer`}*/}
                    {/*  onClick={() => {}}*/}
                    {/*>*/}
                    {/*</div>*/}
                    {video}
                  </div>
                </td>
                <td className="p-4">
                  <img
                    src={"/placeholder.svg"}
                    alt={video}
                    className="w-24 h-12 object-cover rounded"
                  />
                </td>
                <td className="p-4">{"Lol"}</td>
                <td className="p-4">{"Lol"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded-lg p-6">
        {/*<div className="flex items-center gap-4 mb-4">*/}
        {/*  <div className="flex items-center gap-2">*/}
        {/*    <div className="w-3 h-3 rounded-full bg-red-500"></div>*/}
        {/*    <span>Youtube</span>*/}
        {/*  </div>*/}
        {/*  <div className="flex items-center gap-2">*/}
        {/*    <div className="w-3 h-3 rounded-full bg-black"></div>*/}
        {/*    <span>Tiktok</span>*/}
        {/*  </div>*/}
        {/*  <div className="flex items-center gap-2">*/}
        {/*    <div className="w-3 h-3 rounded-full bg-blue-500"></div>*/}
        {/*    <span>Facebook</span>*/}
        {/*  </div>*/}
        {/*</div>*/}

        <div className="h-64 relative">
           {/*Simplified chart representation*/}
          {/*<div className="absolute inset-0 flex items-end">*/}
          {/*  <div className="w-full h-full relative">*/}
          {/*    /!* Red line (Youtube) *!/*/}
          {/*    <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">*/}
          {/*      <path*/}
          {/*        d="M0,80 L10,85 L20,75 L30,80 L40,50 L50,90 L60,70 L70,30 L80,40 L90,50 L100,60"*/}
          {/*        fill="none"*/}
          {/*        stroke="red"*/}
          {/*        strokeWidth="1"*/}
          {/*      />*/}
          {/*    </svg>*/}

          {/*    /!* Black line (Tiktok) *!/*/}
          {/*    <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">*/}
          {/*      <path*/}
          {/*        d="M0,90 L10,70 L20,50 L30,40 L40,20 L50,60 L60,60 L70,20 L80,10 L90,40 L100,20"*/}
          {/*        fill="none"*/}
          {/*        stroke="black"*/}
          {/*        strokeWidth="1"*/}
          {/*      />*/}
          {/*    </svg>*/}

          {/*    /!* Blue line (Facebook) *!/*/}
          {/*    <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">*/}
          {/*      <path*/}
          {/*        d="M0,95 L10,80 L20,80 L30,80 L40,90 L50,90 L60,90 L70,60 L80,40 L90,80 L100,90"*/}
          {/*        fill="none"*/}
          {/*        stroke="blue"*/}
          {/*        strokeWidth="1"*/}
          {/*      />*/}
          {/*    </svg>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*/!* X-axis labels *!/*/}
          {/*<div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">*/}
          {/*  <div>15/03</div>*/}
          {/*  <div>16/03</div>*/}
          {/*  <div>17/03</div>*/}
          {/*  <div>18/03</div>*/}
          {/*  <div>19/03</div>*/}
          {/*  <div>20/03</div>*/}
          {/*  <div>21/03</div>*/}
          {/*  <div>22/03</div>*/}
          {/*  <div>23/03</div>*/}
          {/*  <div>24/03</div>*/}
          {/*</div>*/}

          {/*/!* Y-axis labels *!/*/}
          {/*<div className="absolute top-0 right-0 bottom-0 flex flex-col justify-between items-end text-xs text-gray-500">*/}
          {/*  <div>15</div>*/}
          {/*  <div>10</div>*/}
          {/*  <div>5</div>*/}
          {/*  <div>0</div>*/}
          {/*</div>*/}
        </div>
        <ReactModal isOpen={showCreateModal} ariaHideApp={false}>
          {/*<Modal.Header closeButton>*/}
          {/*  <Modal.Title>Create a New Project</Modal.Title>*/}
          {/*</Modal.Header>*/}
          {/*<Modal.Body>*/}

          {/*</Modal.Body>*/}
          {/*<Modal.Footer>*/}
          <input
              type="text"
              placeholder="Nhập tên của project"
              className="w-full p-2 border rounded m-2"
              id="my-prompt"
              value={projectNameValue}
              onChange={event => setProjectNameValue(event.target.value)}
          />

          {/*<div className="relative w-full">*/}
          {/*  <select className="w-full p-2 m-2 border rounded appearance-none">*/}
          {/*    <option>Tiếng Anh</option>*/}
          {/*    <option>Tiếng Trung</option>*/}
          {/*    <option>Tiếng Việt</option>*/}
          {/*    <option>Tiếng Hàn</option>*/}
          {/*    <option>...</option>*/}

          {/*  </select>*/}
          {/*  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"/>*/}
          {/*</div>*/}

          {/*<label htmlFor="projectFolder">*/}
          {/*  /!*<Button className="p-3 m-2">*!/*/}
          {/*    Select Project Folder*/}
          {/*  /!*</Button>*!/*/}
          {/*</label>*/}
          {/*<input id="projectFolder" directory="" webkitdirectory="" type="file" onChange={event => {*/}
          {/*  let theFiles = event.target.files;*/}
          {/*  let relativePath = theFiles[0].webkitRelativePath;*/}
          {/*  let folder = relativePath.split("/");*/}
          {/*  alert(folder[0]);*/}
          {/*}}/>*/}

          <div className="w-full justify-end flex">
            <Button onClick={handleClose} className="p-3 m-2">
              Đóng
            </Button>
            <Button onClick={async event =>  {
              let temp = await initProject();
              if (temp) onCreateVideo()
            }} className="p-3 m-2">
              Tạo
            </Button>
          </div>
          {/*</Modal.Footer>*/}
        </ReactModal>


      </div>
    </div>
  )
}

