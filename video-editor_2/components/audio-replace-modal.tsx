import React, { useState } from 'react'
import AudioRecorder from './audio-recorder'

interface ImageItem {
    asset_id: number,
    image_url: string,
    custom_image_url: string,
    script: string,
    audio_url: string,
    custom_audio_url?: string,
}

interface AudioReplaceModalProps {
    showAudioModal: boolean
    setShowAudioModal: (showAudioModal: boolean) => void
    selectedAssetId: number | null
    setAssetsUpdateStatus: (status: number) => void
    setToastMessage: (message: string) => void
    setAssets: (assets: ImageItem[]) => void
    assets: ImageItem[]
}

export default function AudioReplaceModal({ showAudioModal, setShowAudioModal, selectedAssetId, setAssetsUpdateStatus, setToastMessage, setAssets, assets }: AudioReplaceModalProps) {
    const [mode, setMode] = useState<'upload' | 'record'>('upload')
    const [tempAudioBlob, setTempAudioBlob] = useState<Blob | null>(null)

    const handleSaveAudio = async () => {
        if (!selectedAssetId || !tempAudioBlob) return;

        //Upload audio
        const formData = new FormData();
        formData.append('file', tempAudioBlob);
        formData.append('asset_id', selectedAssetId.toString());

        const new_audio_response = await fetch('/api/upload/audio', {
            method: 'POST',
            body: formData,
        });

        if (!new_audio_response.ok)  {
            setAssetsUpdateStatus(-1)
            return;
        }

        const result = await new_audio_response.json();
        const custom_url = result.audio_path;

        // Update assets
        const updatedAssets = assets.map((asset) =>
            asset.asset_id === selectedAssetId
                ? { ...asset, custom_audio_url: custom_url }
                : asset
        )

        await fetch('/api/assets_data', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                my_assets: updatedAssets
            })
        })

        setToastMessage("Thay đổi âm thanh thành công.")
        setAssets(updatedAssets)
        setAssetsUpdateStatus(1)
        setShowAudioModal(false)
        setTempAudioBlob(null)
    }

    return (
        <>
            {showAudioModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-1/3 h-1/2 shadow-lg relative flex flex-col">
                        <h2 className="text-lg font-semibold mb-4">Thay thế âm thanh</h2>

                        <div className="mb-4">
                            <button
                                className={`px-4 py-2 mr-2 rounded ${mode === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setMode('upload')}
                            >
                                Đăng tải âm thanh
                            </button>
                            <button
                                className={`px-4 py-2 rounded ${mode === 'record' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setMode('record')}
                            >
                                Ghi âm giọng nói
                            </button>
                        </div>

                        <div className="h-1/2 ">

                            {mode === 'upload' && (
                                <div className="mb-auto flex justify-center items-center h-1/2">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0])
                                                setTempAudioBlob(e.target.files[0])
                                        }}
                                    />
                                </div>
                            )}

                            {mode === 'record' && (
                                <div className="mb-auto flex justify-center items-center h-1/2">
                                    <AudioRecorder onRecordingComplete={(blob) => setTempAudioBlob(blob)} />
                                </div>
                            )}

                            {tempAudioBlob && (
                                <div className="my-auto flex justify-center items-center h-1/2">
                                    <audio controls src={URL.createObjectURL(tempAudioBlob)} />
                                </div>
                            )}

                        </div>

                        <div className="flex mt-auto justify-end space-x-2">
                            <button
                                className="bg-gray-400 text-white px-4 py-2 rounded"
                                onClick={() => {
                                    setShowAudioModal(false)
                                    setTempAudioBlob(null)
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded"
                                onClick={handleSaveAudio}
                            >
                                Lưu âm thanh
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}