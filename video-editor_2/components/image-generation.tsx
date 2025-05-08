"use client"

import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import AudioPlayer from 'react-h5-audio-player';
import AudioReplaceModal from "./audio-replace-modal";
import ImageReplaceModal from "./image-replace-modal";
import { Button } from "@/components/ui/button"

interface ImageGenerationProps {
    onBackToContentCreation: () => void,
    onConfirmImages: () => void
    imageVibe: string
    voiceLanguage: string
}

interface ImageItem {
    asset_id: number,
    image_url: string,
    custom_image_url: string,
    script: string,
    audio_url: string,
    custom_audio_url?: string,
}

export default function ImageGeneration({ onConfirmImages, onBackToContentCreation, imageVibe, voiceLanguage }: ImageGenerationProps) {
    const [assets, setAssets] = useState<ImageItem[]>([])
    const [is_data_loaded, setDataLoaded] = useState(false)
    const [progress, setProgress] = useState("")

    // Support upload/record audio
    const [showAudioModal, setShowAudioModal] = useState(false)
    const [showImageModal, setShowImageModal] = useState(false)
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

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
    // Save to project's resources.json, 
    // configuring the original resources properties 
    // (including length for audios and video)
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
                resource_array.push({
                    id: id,
                    name: `image_${id}`,
                    source: e.image_url,
                    original_duration: e.audio_duration,
                    type: "image"
                });
                id++;
                resource_array.push({
                    id: id, name: `text_${id - 1}`,
                    source: e.script,
                    original_duration: e.audio_duration,
                    type: "subtitle"
                });
                id++;
                resource_array.push({
                    id: id,
                    name: `sound_${id - 2}`,
                    source: e.audio_url,
                    original_duration: e.audio_duration,
                    type: "audio"
                });
                id++;
            })

            const response2 = await fetch('/api/project_init/save_resources', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    resource_array: resource_array
                })
            })
        }
    }

    const disableButtons = (id: number) => {
        const buttons = document.querySelectorAll(`.asset-${id} button`)
        buttons.forEach(button => {
            button.setAttribute("disabled", '')
        });
    }

    const enableButtons = (id: number) => {
        const buttons = document.querySelectorAll(`.asset-${id} button`)
        buttons.forEach(button => {
            button.removeAttribute("disabled")
        });
    }

    const updateScript = (id: number, value: string) => {
        const newAssets = [...assets];
        newAssets[id-1].script = value;
        setAssets(newAssets);
    }

    const updateImage = async (id: number) => {
        if (assets[id-1].script.length === 0) {
            toast.error("Script can not be empty");
            return;
        }

        disableButtons(id);
        const script = assets[id-1].script;

        const response = await fetch('/api/image_generation', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                prompt_data: script,
                prompt_index: id,
                prompt_style: imageVibe
            })
        })

        if (!response.ok) toast.error("Something wrong happened");
        else toast.success("Image updated successfully");

        enableButtons(id);
    }

    const updateSounds = async (id: number) => {
        
        if (assets[id-1].script.length === 0) {
            toast.error("Script can not be empty")
            return;
        }

        disableButtons(id);
        const script = assets[id-1].script;

        const response = await fetch('/api/voice_generation', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                prompt_data: script,
                prompt_index: id,
                prompt_lang: voiceLanguage
            })
        })

        if (!response.ok) toast.error("Something wrong happened");
        else toast.success("Audio updated successfully");

        enableButtons(id);
    }

    const deleteCustomAssets = async (id: number) => {
        disableButtons(id);

        const response = await fetch('api/assets_data/delete_custom_assets', {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                assets_id: id
            })
        });

        if (!response.ok) 
            toast.error("Something wrong happened");
        else {
            toast.success("Custom assets deleted successfully");
            const newAssets = [...assets];
            newAssets[id-1].custom_image_url = "";
            newAssets[id-1].custom_audio_url = "";
            setAssets(newAssets);
        }

        enableButtons(id);
    }

    const generatePreview = async () => {
        setProgress("Đang tạo bản xem trước...")
        try {
            const response = await fetch("/api/compile_video", {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    crf: 32,
                    preset: "ultrafast"
                })
            })
            setProgress("Hoàn thành! Đang chuyển hướng...")
            return true;
        } catch (error) {
            setProgress("Tạo bản xem trước thất bại")
            return false;
        }
    }

    return (
        <>
            <div className="container flex justify-between p-4 border-b">
                <div>
                    {onBackToContentCreation && (
                        <Button variant="outline" onClick={onBackToContentCreation}>
                            Trở lại phác thảo kịch bản
                        </Button>
                    )}
                </div>
            </div>

            <div className="container mx-auto py-4 px-4">
                {assets.map((asset) => {

                    return (
                        <div id={"asset_" + asset.asset_id} key={asset.asset_id} className="border rounded-lg py-2 px-2 mb-2">
                            <div className="bg-white w-full rounded flex items-center justify-center text-xs">
                                <div className="grid grid-flow-row w-full gap-4">
                                    <div className="flex-1 grid grid-cols-9 border-b">
                                        <img
                                            src={`${asset.custom_image_url || asset.image_url}?v=${Date.now()}`}
                                            alt={asset.script}
                                            className="pr-2 col-span-2 mx-auto my-auto w-auto h-auto object-contain"
                                        />
                                        <div className="items-center grid grid-rows-2 col-span-6">
                                            <textarea
                                                readOnly={false}
                                                defaultValue={asset.script}
                                                className="h-full text-base p-1"
                                                onChange={event => updateScript(asset.asset_id, event.target.value)}
                                            >
                                            </textarea>

                                            <AudioPlayer
                                                className="h-full"
                                                src={`${asset.custom_audio_url || asset.audio_url}?v=${Date.now()}`}
                                                onPlay={(e) => {
                                                    e.preventDefault();
                                                    console.log("onPlay")
                                                }}>
                                            </AudioPlayer>
                                        </div>

                                        <div className={`asset-${asset.asset_id} col-span-1 flex flex-col pl-2 gap-y-2 justify-center`}>
                                            <Button
                                                variant="outline"
                                                className="bg-orange-600 text-white p-2 "
                                                onClick={() => updateImage(asset.asset_id)}
                                            >
                                                Cập nhật hình ảnh
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-orange-600 text-white p-2 "
                                                onClick={() => updateSounds(asset.asset_id)}
                                            >
                                                Cập nhật âm thanh
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-green-600 text-white p-2 "
                                                onClick={() => {
                                                    setSelectedAssetId(asset.asset_id);
                                                    setShowAudioModal(true);
                                                }}>
                                                Thay đổi âm thanh
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-green-600 text-white p-2 "
                                                onClick={() => {
                                                    setSelectedAssetId(asset.asset_id);
                                                    setShowImageModal(true);
                                                }}>
                                                Thay đổi hình ảnh
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="bg-red-600 text-white p-2 "
                                                onClick={() => deleteCustomAssets(asset.asset_id)}
                                            >
                                                Xóa tài nguyên
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Support upload/record audio */}
                <AudioReplaceModal
                    showAudioModal={showAudioModal}
                    setShowAudioModal={setShowAudioModal}
                    selectedAssetId={selectedAssetId}
                    setAssets={setAssets}
                    assets={assets}
                />
                {/* Support upload image */}
                <ImageReplaceModal
                    showImageModal={showImageModal}
                    setShowImageModal={setShowImageModal}
                    selectedAssetId={selectedAssetId}
                    setAssets={setAssets}
                    assets={assets}
                />
                <div className="w-full flex items-end justify-end my-4">
                    <span className="text-center justify-self-center content-center">{progress}</span>
                    <Button variant="outline" className="bg-black text-white px-6"
                        onClick={async event => {
                            event.preventDefault();
                            await saveResources();
                            onConfirmImages();
                        }}>
                        Xác nhận thay đổi và tạo bản xem trước
                    </Button>
                    <Button variant="outline" className="bg-red-600 text-white px-6">
                        Hủy thay đổi
                    </Button>
                </div>
            </div>
            <ToastContainer autoClose={2000} />
        </>
    )
}