"use client"

import { useState } from "react"
import Dashboard from "@/components/dashboard"
import ContentCreation from "@/components/content-creation"
import VideoEditor from "@/components/video-editor"
import ImageGeneration from "@/components/image-generation";
require('dotenv').config()

export default function Home() {
  const [currentInterface, setCurrentInterface] = useState(4) // 1: Dashboard, 2: Content Creation, 3: Video Editor

  const handleCreateVideo = () => {
    setCurrentInterface(2)
  }

  const handleApproveAndCreate = () => {
    setCurrentInterface(3)
  }

  const confirmImageChanges = () => {
    setCurrentInterface(4)
  }

  const handleCancel = () => {
    setCurrentInterface(1)
  }

  return (
    <main className="min-h-screen bg-white">
      {currentInterface === 1 && <Dashboard onCreateVideo={handleCreateVideo} />}

      {currentInterface === 2 && (
        <ContentCreation onApproveAndCreate={handleApproveAndCreate} onCancel={handleCancel} />
      )}

      {currentInterface === 3 && <ImageGeneration onConfirmImages={confirmImageChanges}/>}

      {currentInterface === 4 && <VideoEditor onCancel={handleCancel} />}
    </main>
  )
}

