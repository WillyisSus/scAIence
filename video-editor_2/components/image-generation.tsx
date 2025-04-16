"use client"

import {useState, useEffect} from "react";
import AudioPlayer from 'react-h5-audio-player';
import { Button } from "@/components/ui/button"

interface ImageGenerationProps {
    onConfirmImages: () => void
}

interface ImageItem{
    asset_id: number,
    image_url: string,
    script: string,
    audio_url: string,
}

export default function ImageGeneration({onConfirmImages}: ImageGenerationProps) {
    const [assets, setAssets] = useState<ImageItem[]>([])
    const [is_data_loaded, setDataLoaded] = useState(false)

    useEffect(() => {
        const onLoadAssets = async () => {
            if (is_data_loaded) return;

            const response = await fetch('/api/assets_data', {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (response.ok){
                const data = await response.json();
                setAssets(data.output);
                setDataLoaded(true)
            }
        }

        onLoadAssets().then()

        return
    }, [])

    return (
        <div className="container mx-auto py-8 px-4">
            {assets.map((asset) => (
                <div key={asset.asset_id} className="border rounded-lg p-6">
                    <div className="bg-white w-full rounded mb-1 flex items-center justify-center text-xs">
                        <div className="grid grid-flow-row w-full gap-4">
                            <div className="flex-1 grid grid-cols-4 border-b">
                                <img src={asset.image_url} alt={asset.script} width="200em" className="col-span-1"/>
                                <div className="items-center grid grid-rows-2 col-span-3">
                                    <textarea readOnly={true} defaultValue={asset.script}
                                              className="h-full text-base"></textarea>
                                    <AudioPlayer src={asset.audio_url} onPlay={(e) => {
                                        e.preventDefault();
                                        console.log("onPlay")
                                    }}></AudioPlayer>
                                </div>
                            </div>
                            <div className="w-full">
                                <Button variant="outline" className="bg-black text-white px-6">
                                    Thay đổi hình ảnh
                                </Button>
                                <Button variant="outline" className="bg-red-600 text-white px-6">
                                    Xóa câu lệnh này
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="w-full flex items-end">
                <Button variant="outline" className="bg-black text-white px-6" onClick={onConfirmImages}>
                    Xác nhận thay đổi
                </Button>
                <Button variant="outline" className="bg-red-600 text-white px-6">
                    Hủy thay đổi
                </Button>
            </div>
        </div>
    )
}