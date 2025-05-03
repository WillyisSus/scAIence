"use client"

import { useState, useEffect } from "react";
import AudioPlayer from 'react-h5-audio-player';
import AudioReplaceModal from "./audio-replace-modal";
import { Button } from "@/components/ui/button"

interface ImageGenerationProps {
    onConfirmImages: () => void
}

interface ImageItem {
    asset_id: number,
    image_url: string,
    script: string,
    audio_url: string,

    // Support upload/record audio
    custom_audio?: File | Blob,
    custom_audio_url?: string,
    audio_version?: number
}

export default function ImageGeneration({ onConfirmImages }: ImageGenerationProps) {
    const [assets, setAssets] = useState<ImageItem[]>([])
    const [is_data_loaded, setDataLoaded] = useState(false)
    const [progress, setProgress] = useState("")

    // Support upload/record audio
    const [showAudioModal, setShowAudioModal] = useState(false)
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
    const [tempAudioBlob, setTempAudioBlob] = useState<Blob | null>(null);
    const [mode, setMode] = useState<'upload' | 'record'>('upload')

    useEffect(() => {
        const onLoadAssets = async () => {
            if (is_data_loaded) return;

            const response = await fetch('/api/assets_data', {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (response.ok) {
                const data = await response.json();
                setAssets(data.output);
                setDataLoaded(true)
            }
        }

        onLoadAssets().then()

        return
    }, [])

    const saveResources = async () => {
        const response = await fetch('/api/assets_data', {
            method: 'GET',
            headers: {
                'Content-type': 'application/json'
            }
        })

        if (response.ok) {
            const resource_array = [];
            const data = await response.json();
            let id = 0;
            data.output.forEach((e: any) => {
                resource_array.push({id: id, name: `image_${id}`, source: e.image_url, type: "image"});
                id++;
                resource_array.push({id: id, name: `text_${id - 1}`, source: e.script, type: "subtitle"});
                id++;
                resource_array.push({id: id, name: `sound_${id - 2}`, source: e.audio_url, type: "audio"});
                id++;
            })

            const response2 = await fetch('/api/project_init/save_resources', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    resource_array : resource_array
                })
            })
        }
    }

    const generatePreview = async () => {
        setProgress("Đang tạo bản xem trước...")
        try {
            const response = await fetch("/api/compile_video", {
                method: 'GET',
                headers: {
                    'Content-type' : 'application/json'
                }
            })
            setProgress("Hoàn thành! Đang chuyển hướng...")
            return true;
        } catch (error) {
            setProgress("Tạo bản xem trước thất bại")
            return false;
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {assets.map((asset) => {

                console.log("Current")
                console.log(asset)

                return (
                <div key={asset.asset_id} className="border rounded-lg p-6">
                    <div className="bg-white w-full rounded mb-1 flex items-center justify-center text-xs">
                        <div className="grid grid-flow-row w-full gap-4">
                            <div className="flex-1 grid grid-cols-4 border-b">
                                <img src={asset.image_url} alt={asset.script} width="200em" className="col-span-1" />
                                <div className="items-center grid grid-rows-2 col-span-3">
                                    <textarea readOnly={true} defaultValue={asset.script}
                                        className="h-full text-base"></textarea>
                                    <AudioPlayer
                                        key={asset.audio_version || 0}
                                        src={asset.custom_audio_url || asset.audio_url}
                                        onPlay={(e) => {
                                            e.preventDefault();
                                            console.log("onPlay")
                                        }}>
                                    </AudioPlayer>
                                </div>
                            </div>
                            <div className="w-full">
                                <Button variant="outline" className="bg-black text-white px-6">
                                    Thay đổi hình ảnh
                                </Button>
                                <Button variant="outline" className="bg-red-600 text-white px-6">
                                    Xóa câu lệnh này
                                </Button>
                                {/* Support upload/record audio */}
                                <Button variant="outline" className="bg-green-600 text-white px-6"
                                    onClick={() => {
                                        setSelectedAssetId(asset.asset_id);
                                        setShowAudioModal(true);
                                        setTempAudioBlob(null);
                                        setMode('upload');
                                    }}>
                                    Thay đổi âm thanh
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )})}

            {/* Support upload/record audio */}
            <AudioReplaceModal
                showAudioModal={showAudioModal}
                setShowAudioModal={setShowAudioModal}
                selectedAssetId={selectedAssetId}
                setAssets={setAssets}
                assets={assets}
            />
            <div className="w-full flex items-end justify-end my-4">
                <span className="text-center justify-self-center content-center">{progress}</span>
                <Button variant="outline" className="bg-black text-white px-6" onClick={async event => {
                    event.preventDefault();
                    await saveResources();
                    let result = await generatePreview();
                    if (result) onConfirmImages();
                }}>
                    Xác nhận thay đổi và tạo bản xem trước
                </Button>
                <Button variant="outline" className="bg-red-600 text-white px-6">
                    Hủy thay đổi
                </Button>
            </div>
        </div>
    )
}