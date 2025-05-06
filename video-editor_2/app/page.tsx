"use client"

import {useEffect, useState} from "react"
import Dashboard from "@/components/dashboard"
import ContentCreation from "@/components/content-creation"
import VideoEditor from "@/components/video-editor"
import ImageGeneration from "@/components/image-generation";
require('dotenv').config()

export default function Home() {
  const [currentInterface, setCurrentInterface] = useState(1) // 1: Dashboard, 2: Content Creation, 3: Video Editor
  const [is_data_loaded, setDataLoaded] = useState(false)
  const [imageVibe, setImageVibe] = useState("Realistic");
  const [voiceLanguage, setVoiceLanguage] = useState("en");

  useEffect(() => {
    const onLoadAssets = async () => {
      if (is_data_loaded) return;

      const response = await fetch('/api/project_init/set_page', {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setCurrentInterface(data.output);
        setDataLoaded(true)
      }
    }

    onLoadAssets().then()

    return
  }, [currentInterface])

  const goToPage = async (page: number) => {
    let response = await fetch("/api/project_init/set_page", {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        page: page
      })
    })

    if (response.ok){
      setCurrentInterface(page)
    }
  }

  const handleCreateVideo = async () => {
    await goToPage(2)
  }

  const handleApproveAndCreate = async () => {
    await goToPage(3)
  }

  const confirmImageChanges = async () => {
    await goToPage(4)
  }

  const handleCancel = async () => {
    await goToPage(1)
  }

  return (
    <main className="min-h-screen bg-white">
      {currentInterface === 1 && 
        <Dashboard 
          onCreateVideo={async () => {await handleCreateVideo()}} 
          onGoToProject={async () => {await confirmImageChanges()}}
        />
      }

      {currentInterface === 2 && 
        <ContentCreation 
          imageVibe={imageVibe} voiceLanguage={voiceLanguage}
          setVoiceLanguage={(voiceLanguage) => setVoiceLanguage(voiceLanguage)}
          setImageVibe={(imageVibe) => setImageVibe(imageVibe)}
          onApproveAndCreate={async () => {await handleApproveAndCreate()}} 
          onCancel={async () => {await handleCancel()}} 
          onContinue={async () => {await handleApproveAndCreate()}} 
        />
      }

      {currentInterface === 3 && 
        <ImageGeneration 
          imageVibe={imageVibe} voiceLanguage={voiceLanguage}
          onBackToContentCreation={async () => {await handleCreateVideo()}}
          onConfirmImages={async () => {await confirmImageChanges()}}
        />
      }

      {currentInterface === 4 && <VideoEditor onCancel={async () => {await handleCancel()}} />}
    </main>
  )
}

