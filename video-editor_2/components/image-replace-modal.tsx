import React, { useState } from 'react'

interface ImageItem {
    asset_id: number,
    image_url: string,
    script: string,
    audio_url: string,
    custom_image_url: string,
}

interface ImageReplaceProps {
    showImageModal: boolean
    setShowImageModal: (showImageModal: boolean) => void
    selectedAssetId: number | null
    setAssets: (assets: ImageItem[]) => void
    assets: ImageItem[]
}

export default function ImageReplaceModal({ showImageModal, setShowImageModal, selectedAssetId, setAssets, assets }: ImageReplaceProps) {
    const [uploadedImage, setUploadedImage] = useState<Blob | null>(null)

    const handleSaveImage = async () => {
        if (!selectedAssetId || !uploadedImage) return;

        //Upload image
        const formData = new FormData();
        formData.append('file', uploadedImage);
        formData.append('asset_id', selectedAssetId.toString());

        const new_image_response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
        });

        if (!new_image_response.ok) return;

        const result = await new_image_response.json();
        const custom_url = result.image_path;

        // Update assets
        const updatedAssets = assets.map((asset) =>
            asset.asset_id === selectedAssetId
                ? { ...asset, custom_image_url: custom_url }
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

        setAssets(updatedAssets)
        setShowImageModal(false)
        setUploadedImage(null)
    }

    return (
        <>
            {showImageModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-1/3 h-1/2 shadow-lg relative flex flex-col">
                        <h2 className="text-lg font-semibold mb-4">Replace Image</h2>

                        {uploadedImage && (
                            <div className="my-auto flex justify-center items-center h-1/2">
                                <img src={URL.createObjectURL(uploadedImage)} className="max-h-full max-w-full object-contain" />
                            </div>
                        )}

                        <div className="mb-auto flex justify-center items-center h-1/2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0])
                                        setUploadedImage(e.target.files[0])
                                }}
                            />
                        </div>

                        <div className="flex mt-auto justify-end space-x-2">
                            <button
                                className="bg-gray-400 text-white px-4 py-2 rounded"
                                onClick={() => {
                                    setShowImageModal(false)
                                    setUploadedImage(null)
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded"
                                onClick={handleSaveImage}
                            >
                                Save Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}