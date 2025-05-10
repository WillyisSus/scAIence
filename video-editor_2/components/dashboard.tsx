"use client"

import { useEffect, useRef, useInsertionEffect, useState } from "react"
import { Check, Plus, Trash2, SquarePlus, Eye, DiscAlbum, AwardIcon } from "lucide-react"
import { Button } from "@/components/ui/button";
import { ToastContainer, toast } from 'react-toastify';
import ReactModal from 'react-modal';
import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import { eventNames } from "process";
import { signIn, signOut, useSession } from 'next-auth/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"

         
import axios from "axios";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { PrimeIcons } from 'primereact/api';
import ReactPlayer from "react-player";
import YouTubePlayer from "react-player/youtube";
import { AsyncResource } from "async_hooks";
interface DashboardProps {
  onCreateVideo: () => void
  onGoToProject: () => void
}

export default function Dashboard({ onCreateVideo, onGoToProject }: DashboardProps) {
  const [selectedVideos, setSelectedVideos] = useState("")
  const [open, setOpen] = useState(false)
  const [openShare, setOpenShare] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectNameValue, setProjectNameValue] = useState("project-name-sample");
  const [is_data_loaded, setDataLoaded] = useState(false)
  const [projectList, setProjectList] = useState([]);
  const [exportedFiles, setExportedFiles] = useState([])
  const { data: session, update } = useSession();
  const [uploadedDataFacebook, setUploadedDataFacebook] = useState([])
  const [uploadedDataYoutube, setUploadedDataYoutube] = useState([])
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("https://www.youtube.com/watch?v=_PSjoVXFGAQ")
  const [selectedProvider,  setSelectedProvider] = useState("")
  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedProjectForDeletion, setSelectedProjectForDeletion] = useState([])
  const [latestViewCount, setLatestViewCount] = useState(0)
  const oldViewCount = useRef(0)
  const [latestLikeCount, setLatestLikeCount] = useState(0)
  const oldLikeCount = useRef(0)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const [selectedPageDropdownText, setSelectedPageDropdownText] = useState("")
  const MENU_ID = "project-context-menu"
  const { show } = useContextMenu({ id: MENU_ID })
  const getProjectNameAndShowMenu = (event) => {
    console.log(event.currentTarget.id)
    handleShowProjectContextMenu(event, { project_name: event.currentTarget.id })
  }
  const openToYoutubeVideo = (videoID) => {
    window.open(`https://www.youtube.com/watch?v=${videoID}`, '_blank').focus();
  }
  const openToFacebookVideo = (videoID) => {
    window.open(`https://www.facebook.com/watch/?v=${videoID}`, '_blank').focus();
  }
  const handleShowProjectContextMenu = (event: any, project: {project_name:String}) => {
    console.log("Selected: ", project.project_name)
    show({
      event,
      props: project
    })
  }

  const showShareDialog = (video:string) => {
    setSelectedVideos(video)
    setOpenShare(true)
  }
  const handleConfirmShare = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.warn("Vui lòng nhập tiêu đề và mô tả.")
      return
    }
    setIsSubmitting(true)
    try {
      if (selectedProvider === "facebook") {
        const response = await axios.post('/api/auth/upload_facebook', {
          pageId: selectedPage.id,
          pageAccessToken: selectedPage.access_token,
          pageName: selectedPage.name, 
          title: formData.title,
          description: formData.description,
        });
        const data = response.data;
        console.log(data);
        toast.success("Đăng lên Facebook thành công!")
        setOpenShare(false)
      } else if (selectedProvider === "google") {
        const response = await axios.post('/api/auth/upload_youtube', {
          channelId: session.googleUserId,
          accessToken: session.googleAccessToken,
          channel: session.user.name,
          title: formData.title,
          description: formData.description
        });
        const data = response.data;
        console.log(data);
        toast.success("Đăng lên Youtube thành công!")
        setOpenShare(false)
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Upload failed';
      console.error("Lỗi khi upload:", errMsg);
      toast.error("Đăng lên thất bại.")
    }
    setFormData({ title: "", description: "" })
    setIsSubmitting(false)
    setSelectedProvider("")
  }
  const handleConfirm = async () => {
    if (selectedProjectForDeletion.length == 0) return
    const response = await fetch('/api/dashboard/delete_project', {
          method: 'POST', 
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            chosen_projects: selectedProjectForDeletion
          })
        })
    if (response.ok){
      toast.success("Đã xóa dự án")
      const data = await response.json();
      setProjectList(JSON.parse(data.output))
    }else{
      toast.error("Không thể xóa dự án")
    }
    setSelectedProjectForDeletion([])
    setOpen(false)
  }
  const handleProjectContextMenuItemClick = async ({ id, event, props }) => {
    switch (id) {
      case "view_exported_video": {
        break
      }
      case "delete":{
        setOpen(true)
        setSelectedProjectForDeletion([props.project_name])
        // const response = await fetch('/api/dashboard/delete_project', {
        //   method: 'POST', 
        //   headers: {
        //     'Content-type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     chosen_projects: [props.project_name]
        //   })
        // })
        // if (response.ok){
        //   toast.success("Đã xóa dự án")
        //   const data = await response.json();
        //   setProjectList(JSON.parse(data.output))

        // }else{
        //   toast.error("Không thể xóa dự án")
        // }
        break
      }
      case "go_to_video_editor": {
        console.log(props.project_name)
        await selectProject(props.project_name)
        onGoToProject()
        break
      }
    }
  }
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

  useEffect(() => {
    const getAllExportedVideos = async () => {
      const response = await fetch("/api/dashboard/exported_videos", {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const exporteds = JSON.parse(data.output)
        setExportedFiles(exporteds)
      }
    }
    getAllExportedVideos().then()
  }, [])

  useEffect(() => {
    const getAllExportedVideos = async () => {
      const response = await fetch("/api/dashboard/uploaded_data", {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const uploadeds = JSON.parse(data.output)
        setUploadedDataFacebook(uploadeds.facebook)
        setUploadedDataYoutube(uploadeds.youtube)
      }
    }
    getAllExportedVideos().then()
  }, [])
  // User signin-signout and session management
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
  const facebookItemClick = async (page:{}, video:{}) => {
    if (!page || ! video) return
    setSelectedPage(page)
    setSelectedProvider("facebook")
    setUploadedVideoUrl(`https://www.facebook.com/watch/?v=${video.upload_id}`)
    const response = await axios.post('/api/auth/get_facebook_view', {
      videoId: video.upload_id,
      pageAccessToken: session.pages.find(paged => paged.id === page.pageID)?.access_token
    });
    const data = response.data;
    console.log(data);
    if (data.likeCount !== latestLikeCount){
      oldLikeCount.current = latestLikeCount
      setLatestLikeCount(data.likeCount);
    }
    if (data.viewCount !== latestViewCount){
      oldViewCount.current = latestViewCount
      setLatestViewCount(data.viewCount)
    }
  }

  const googleItemClick = async (video:{}) => {
    if (!video) return
    setUploadedVideoUrl(`https://www.youtube.com/watch?v=${video.upload_id}`)
    setSelectedProvider("google")
    const response = await axios.post('/api/auth/get_youtube_view', {
      videoId: video.upload_id,
      accessToken: session.googleAccessToken,
    });
    const data = response.data;
    console.log(data);
    if (data.likeCount !== latestLikeCount){
      oldLikeCount.current = latestLikeCount
      setLatestLikeCount(data.likeCount);
    }
    if (data.viewCount !== latestViewCount){
      oldViewCount.current = latestViewCount
      setLatestViewCount(data.viewCount)
    }
  }

  const facebookShareItemCLick = (page:{}) => {
    if (!page) return
    setSelectedPage(page)
    setSelectedPageDropdownText(page?.name)
    setSelectedProvider("facebook")
  }
  const youtubeShareItemClick = (page) =>{
    setSelectedProvider("google")
    setSelectedPageDropdownText(page)
  }
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
    if (projectList.includes(projectNameValue)){
      toast.error("Đã tồn tại dự an tên này");
      return false;
    }

    else if (!checkValidFileName(projectNameValue)){
      toast.error("Tên không hợp lệ.");
      return false;
    }


    const response = await fetch('/api/project_init/create_index', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        project_name: projectNameValue
      })
    })

    if (response.ok) {
      toast.success("Tạo project thành công!");
      return true;
    }
  }

  const selectProject = async (selectedProjectName: string) => {
    console.log(selectedProjectName);
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

  const checkValidFileName= (fname : string) => {
    const badCharacter = /^[^\\/:*?"<>|]+$/;
    const badStartPeriod = /^\./;
    const badName = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i;
    // return function isValid(fname){
    return badCharacter.test(fname) && !badStartPeriod.test(fname) && !badName.test(fname);
    // }
  };

  return (
    <div className="container flex flex-col items-center justify-center mx-auto py-8 gap-2 px-4">
      <Menu id={MENU_ID}>
        <Item id="go_to_video_editor" onClick={handleProjectContextMenuItemClick}> Chỉnh sửa Timeline dự án</Item>
        <Item id="delete" onClick={handleProjectContextMenuItemClick}> Xóa dự án </Item>

      </Menu>
  
      <div className="flex w-full justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {session ? "Đã đăng nhập" : "Đăng nhập"}  <ChevronRight className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-4">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Facebook</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {!session ? (
                    <DropdownMenuItem onClick={() => userSignIn("facebook")}>
                      Đăng nhập
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {!session.facebookAccessToken ? (
                        <DropdownMenuItem onClick={() => userSignIn("facebook")}>
                          Chuyển tài khoản
                        </DropdownMenuItem>
                      ) : (
                        <>
                          {session.pages?.map((page: any) => (
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
                  {!session ? (
                    <DropdownMenuItem onClick={() => userSignIn("google")}>
                      Đăng nhập
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {!session.googleAccessToken ? (
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
          <Button variant="default" className="flex items-center gap-2 bg-black text-white" onClick={handleShow}>
            <Plus className="h-5 w-5" />
            Tạo dự án
          </Button>
          {/* <Button variant="outline" className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Xóa
          </Button> */}
        </div>
      </div>
      <h2 className="font-bold font-mono text-2xl">Danh sách dự án</h2>
      <div id="project-table" className="w-full border rounded-lg overflow-hidden mb-8">
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
                  Tên dự án
                </div>
              </th>
              <th className="p-4 text-left">Bản xem trước</th>
              <th className="p-4 text-left">Trạng thái</th>
              <th className="p-4 text-left">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {projectList.map((project) => (
              <tr key={project} id={project} className="border-b" onContextMenu={getProjectNameAndShowMenu}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/*<div*/}
                    {/*  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer`}*/}
                    {/*  onClick={() => {}}*/}
                    {/*>*/}
                    {/*</div>*/}
                    {project}
                  </div>
                </td>
                <td className="p-4" >
                  <img
                    src={"/placeholder.svg"}
                    alt={project}
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
      <h2 className="font-bold font-mono text-2xl">Video đã được xuất bản</h2>
      <div id="exported-videos" className="border flex flex-col justify-center items-center w-full rounded-lg overflow-hidden mb-8 min-h-20">
        {exportedFiles.length <= 0 ? (
          <div>
            <span className="text-xl py-8  font-bold text-center">Chưa có video được xuất bản</span>
            <div className="flex flex-row items-center justify-evenly w-[50%] py-2">
              <span className="font-bold text-green-700"> Xuất bản video </span> hoặc
              <button className="btn w-40 h-10 rounded-l rounded px-2  flex flex-row
              text-white bg-black border-2 border-black hover:bg-white hover:text-black transition-colors
              text-center items-center justify-between">Tạo dự án mới <SquarePlus></SquarePlus></button>
            </div>
          </div>
        ) : (
          <>
            <table className="w-full">
                <thead>
                  <tr className="border">
                  <th className="p-4 text-left">Đường dẫn trên thiết bị</th>
                  <th className="p-4 text-left">Xem video</th>
                  <th className="p-4 text-left">Chia sẻ video</th>
                  </tr>
                </thead>
                <tbody>
                {exportedFiles.map((exportedFile) => (
                  <tr key={exportedFile} className="border">
                    <td className="p-4 text-left">{exportedFile}</td>
                    <td className="p-4 text-left">
                      <button className="w-fit h-fit py-2 px-2 rounded-lg flex items-center gap-2
                      text-white bg-black border-black border
                      hover:text-black hover:bg-white
                      transition-colors ease-linear
                      "> Chiếu video <i className="pi pi-play"></i> </button>
                    </td>
                    <td className="p-4 text-left">
                    <button className="w-fit h-fit py-2 px-2 rounded-lg flex items-center gap-2
                      text-black bg-white border-black border
                      hover:text-white hover:bg-black
                      transition-colors ease-linear
                      " onClick={() => showShareDialog(exportedFile)}> Đăng tải <i className="pi pi-share-alt"></i> </button>
                    </td>
                  </tr>
                 ))}
                </tbody>
              </table>
              
          </>
        )}
      </div>
      <h2 className="font-bold font-mono text-2xl">Video đã được đăng tải</h2>
      <div id="uploaded-data" className="border flex flex-col justify-center items-center w-full  rounded-lg overflow-hidden mb-8 min-h-20">
        {!session?
          (<div className="py-8 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-center">Đăng nhập vào nền tảng tương ứng để xem video đã đăng tải</span>
            <div className="flex flex-row items-center justify-center min-w-[60%] w-[80%] py-2 gap-2">
              <button onClick={() => userSignIn("facebook")}  className="btn min-w-40 w-fit h-10 rounded-l rounded px-2  flex flex-row
              text-white bg-blue-600 border-2 border-blue-600 hover:bg-white hover:text-blue-600 transition-colors
              text-center items-center justify-between">Đăng nhập Facebook <i className=" px-2 pi text-xl pi-facebook"/></button>
              <button onClick={() => userSignIn("google")} className="btn min-w-40 w-fit h-10 rounded-l rounded px-2  flex flex-row
              text-white bg-red-600 border-2 border-red-600 hover:bg-white hover:text-red-600 transition-colors
              text-center items-center justify-between">Đăng nhập Youtube <i className=" px-2 pi text-xl pi-youtube"/></button>
            </div>
          </div>)
        : (
          <>
            {session.facebookAccessToken ? (
              <div className="w-full">
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
                            Kênh đăng tải
                          </div>
                        </th>
                        <th className="p-4 text-left">Thông tin video</th>
                     
                      </tr>
                    </thead>
                    <tbody>
                    {uploadedDataFacebook.map((page) => (
                      <tr key={page.pageID} id={page.pageID} className="border-b">
                        <td className="p-4">
                          {page.pageName}
                        </td>
                        <td>
                          <table className="w-full">
                            <thead className="border-b">
                            <th className="p-4 text-center">
                               Video được đăng tải
                            </th>
                            <th className="p-4 text-center">Tiêu đề đăng tải</th>
                            <th className="p-4 text-center">Hiệu suất video</th>
                            </thead>
                            <tbody>
                            {page.video.map((uploadedVideo) => (
                              <tr key={uploadedVideo.upload_id} className="border-b">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      {/*<div*/}
                                      {/*  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer`}*/}
                                      {/*  onClick={() => {}}*/}
                                      {/*>*/}
                                      {/*</div>*/}
                                      {uploadedVideo.local_path}
                                    </div>
                                  </td>
            
                                  <td className="p-4">
                                    <div className="btn cursor-pointer hover:text-blue-500 hover:border hover:border-blue-500 border border-white py-2 px-2 rounded-xl flex justify-center items-center gap-2"
                                      onClick={() =>  openToFacebookVideo(uploadedVideo.upload_id)}>
                                        {uploadedVideo.title} <i className="pi pi-external-link"/>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center justify-center" onClick={()=>facebookItemClick(page, uploadedVideo)}>
                                        <button className="bg-black  hover:bg-white border-2 border-black text-white hover:text-black px-2 py-1 rounded-xl transition-colors ease-linear">
                                          <Eye></Eye>
                                        </button>
                                    </div>
                                  </td>
                              </tr>
                              ))}
                            </tbody>
                          
                          </table>
                        </td>
                       
                      </tr>
                    ))}
                    </tbody>
                  </table>
              </div>
            ) : (
              <div className="w-full">
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
                            Kênh đăng tải
                          </div>
                        </th>
                        <th className="p-4 text-left">Thông tin video</th>
                     
                      </tr>
                    </thead>
                    <tbody>
                    {uploadedDataYoutube.map((page) => (
                      <tr key={page.pageID} id={page.pageID} className="border-b w-full">
                        <td className="p-4">
                          {page.pageName}
                        </td>
                        <td>
                          <table className="w-full">
                            <thead>
                            <th className="p-4 text-left">
                               Video được đăng tải
                            </th>
                            <th className="p-4 text-left">Tiêu đề đăng tải</th>
                            <th className="p-4 text-left">Hiệu suất video</th>
                            </thead>
                            <tbody>
                            {page.video.map((uploadedVideo) => (
                              <tr key={uploadedVideo.upload_id} className="border-b">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      {/*<div*/}
                                      {/*  className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer`}*/}
                                      {/*  onClick={() => {}}*/}
                                      {/*>*/}
                                      {/*</div>*/}
                                      {uploadedVideo.local_path}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="btn cursor-pointer hover:text-red-600 hover:border hover:border-red-600 border border-white py-2 px-2 rounded-xl flex justify-center items-center gap-2"
                                    onClick={() =>  openToYoutubeVideo(uploadedVideo.upload_id)}>
                                        {uploadedVideo.title} <i className="pi pi-external-link"/>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => googleItemClick(uploadedVideo)} className="bg-black  hover:bg-white border-2 border-black text-white hover:text-black px-2 py-1 rounded-xl transition-colors ease-linear">
                                          <Eye></Eye>
                                        </button>
                                    </div>
                                  </td>
                              </tr>
                              ))}
                            </tbody>
                          
                          </table>
                        </td>
                       
                      </tr>
                    ))}
                    </tbody>
                  </table>
              </div>
            )}
          </>
        )}
      </div>
      <h2 className="font-bold font-mono text-2xl">Hiệu suất hiện tại của một video</h2>
      <div id="statistic-board" className="py-4 border flex flex-col gap-3 justify-center items-center w-full  rounded-lg overflow-hidden mb-8 min-h-20">
        <ReactPlayer controls style={{
          width: '80%'
        }} url={uploadedVideoUrl}></ReactPlayer>
        <div className="w-full flex flex-col justify-center items-center ">
          <div className="w-[30%] max-w-80 min-w-56 py-4 px-2 font-bold justify-between flex flex-row items-center ">
            <div>
              <i className="pi pi-eye"/> Lượt xem: {latestViewCount}
            </div>
            <div className="text-green-600">
              {latestViewCount - oldViewCount.current} <i className="pi pi-arrow-up"/>
            </div>
          </div>
          <div className="w-[30%] max-w-80 min-w-56 py-4 px-2 font-bold justify-between flex flex-row items-center ">
          <div>
              <i className="pi pi-thumbs-up"/> Lượt thích: {latestLikeCount}
            </div>
            <div className="text-green-600">
              {latestLikeCount - oldLikeCount.current} <i className="pi pi-arrow-up"/>
            </div>
          </div>
        </div>
      </div>
      <ReactModal isOpen={showCreateModal} ariaHideApp={false}>
        {/*<Modal.Header closeButton>*/}
        {/*  <Modal.Title>Create a New Project</Modal.Title>*/}
        {/*</Modal.Header>*/}
        {/*<Modal.Body>*/}

        {/*</Modal.Body>*/}
        {/*<Modal.Footer>*/}
        <label htmlFor={"project-name-field"}>Tên dự án (có quy định cấu trúc như tên thư mục)</label>

        <input
          type="text"
          placeholder="Nhập tên của project"
          className="p-2 border rounded m-2"
          id="project-name-field"
          value={projectNameValue}
          onChange={event => setProjectNameValue(event.target.value)}
        />

        <div className="">
          <Button onClick={handleClose} className="p-3 m-2">
            Đóng
          </Button>
          <Button onClick={async event => {
            let temp = await initProject();
            if (temp) onCreateVideo()
          }} className="p-3 m-2">
            Tạo
          </Button>
        </div>
        {/*</Modal.Footer>*/}
      </ReactModal>
      <ToastContainer autoClose={1000} position="bottom-center"/>
      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="[&>button.absolute.top-4.right-4]:hidden"
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Xóa dự án {selectedProjectForDeletion[selectedProjectForDeletion.length - 1]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              Khi thực hiện xóa dự án, tất cả tài nguyên được lưu bên trong thư mục dự án ("{"path_to_app/public/" + selectedProjectForDeletion[selectedProjectForDeletion.length - 1]}") sẽ bị xóa, bao gồm cả hình ảnh, audio đã được tạo ra bởi hệ thống, video được xuất bản trong thư mục con "exports".
              Sau khi bấm nút "Xác nhận", hệ thống sẽ thực hiện xóa thư mục dự án này trên thiết bị.
            </div>
            <DialogFooter>
              <button className="w-fit px-2 py-1 rounded-lg border-2 border-red-600 bg-white text-red-600
                                hover:text-white hover:bg-red-600 transition-colors ease-linear " onClick={handleConfirm}>Xác nhận</button>
              <DialogClose asChild onClick={() => setSelectedProjectForDeletion([])}>
                <Button>Hủy</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      <Dialog open={openShare} onOpenChange={setOpenShare}>
          <DialogContent className="[&>button.absolute.top-4.right-4]:hidden"
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              {!session ? 
              (
              <DialogTitle>Xin hãy đăng nhập để chia sẻ lên mạng xã hội</DialogTitle>
              ): (
                <DialogTitle>Chia sẻ dự án lên {session.facebookAccessToken? "Facebook" : "Youtube"}</DialogTitle>
              )}
            </DialogHeader>
            {session? (
              <div className="space-y-4 py-4">
                <h3 className="font-bold">Trang đăng tải</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {selectedPageDropdownText.length === 0 ? "Chọn trang đăng tải": selectedPageDropdownText} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-4">
                    {
                    session.facebookAccessToken ? 
                    (
                      <>
                        {session.pages?.map((page: any) => (
                          <DropdownMenuItem key={page.id} onClick={() => facebookShareItemCLick(page)}>
                            {page.name}
                          </DropdownMenuItem>
                        ))}
                                            </>
                    ): 
                    ( <>
                        <DropdownMenuItem onClick={() => youtubeShareItemClick(session.user.name)}>
                          {session.user.name}
                        </DropdownMenuItem>
                      </>)
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
                <h3 className="font-bold">Thông tin đăng tải</h3>
                <div className="space-y-4">
                    {/* {dialogError && <p className="text-sm text-red-500">{dialogError}</p>} */}
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
              </div>
            ) : 
            (<></>)
            }
            <DialogFooter>
              <DialogClose asChild>
                <button disabled={isSubmitting} className="w-fit px-2 py-1 rounded-lg border-2 border-black bg-white text-black
                                hover:text-white hover:bg-black transition-colors ease-linear " onClick={() => setSelectedVideos("")}>Hủy</button>
              </DialogClose>
              <button disabled={isSubmitting} className="w-fit px-2 py-1 rounded-lg border-2 border-green-600 bg-green-600 text-white
                                hover:text-green-600 hover:bg-white transition-colors ease-linear " onClick={handleConfirmShare}>Xác nhận</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}

