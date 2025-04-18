"use client"
import {ChevronDown, Play, Plus} from "lucide-react"
import {Button} from "@/components/ui/button"
import {useState} from "react";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface ContentCreationProps {
  onApproveAndCreate: () => void
  onCancel: () => void
}

interface ImageItem{
  asset_id: number,
  image_url: string,
  script: string,
  audio_url: string,
}

export default function ContentCreation({onApproveAndCreate, onCancel}: ContentCreationProps) {

  const [scriptOutput, setScriptOutput] = useState("")
  const [scriptInput, setScriptInput] = useState("")
  const [audio_source, setAudioSource] = useState("sounds/fly.wav")
  const [audio, setAudioContent] = useState(new Audio(audio_source))
  const [progress, setProgress] = useState("")

  const [assets, setAssets] = useState<ImageItem[]>([
    {asset_id: 0, image_url: "", script: "An apple", audio_url: "sounds/output.mp3"}
    // {asset_id: 1, image_url: "", script: "A pineapple", audio_url: "sounds/output.mp3"},
    // {asset_id: 2, image_url: "", script: "Grapes", audio_url: "sounds/output.mp3"}
  ])


  const onGenerateContent = async () => {
    let promptArea = document.getElementById("my-text-area")
    let promptButton = document.getElementById("prompt-button")
    // let promptGet = document.getElementById("my-prompt")
    if (promptArea !== null && promptButton !== null){
      try {
        promptButton.setAttribute("disabled",'');
        const response = await fetch('/api/script_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({body: scriptInput})
        })

        let data = await response.json()

        if (response.ok){
          let result = data.output.replaceAll(/\*/g,'')
          setScriptOutput(result)
        }
        else {
          setScriptOutput(data.error)
        }
        promptButton.removeAttribute("disabled");
      }
      catch (error){

      }
    }

  }

  const onGenerateSound = async () => {
    // let audio_player = document.getElementById("prompted-audio-player")
    // let audio = document.getElementById("prompted-audio")
    let voiceButton = document.getElementById("voice-button")

    let script_input = scriptOutput;
    if (voiceButton !== null){
      try {
        voiceButton.setAttribute("disabled",'');
        const response = await fetch('/api/voice_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({body: script_input})
        })

        if (response.ok){
          console.log("saved new")
          setAudioSource("sounds/output.wav")
          setAudioContent(new Audio(audio_source))
          audio.load()
        }
        else {
          setAudioSource("sounds/fly.wav")
          setAudioContent(new Audio(audio_source))
          audio.load()
        }
        voiceButton.removeAttribute("disabled");
      }
      catch (error){
        // xd
      }
    }

    // if (audio_player !== null){
    //   audio_player.play
    // }
  }

  const onGenerateImagesAndVoiceWithScript = async () => {
    try {
      for (const s of assets){
        setProgress("Generating image " + (s.asset_id + 1) + " out of 3...")
        const image_response = await fetch('/api/image_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            prompt_data: s.script,
            prompt_index: s.asset_id
          })
        })

        await image_response.json();

        if (image_response.ok){
          s.image_url = "images/generated_image_" + s.asset_id + ".png"
        }

        setProgress("Generating voice " + (s.asset_id + 1) + " out of 3...")
        const voice_response = await fetch('/api/voice_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            prompt_data: s.script,
            prompt_index: s.asset_id
          })
        })

        if (voice_response.ok){
          s.audio_url = "sounds/generated_voice_" + s.asset_id + ".mp3"
        }
      }

      setProgress("Saving data...")
      await fetch('/api/assets_data',{
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          my_assets: assets
        })
      })
    }
    catch (error) {

    }
  }

  return (
  <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Tùy chỉnh kịch bản</h2>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Chọn chủ đề tạo</label>
            <div className="flex gap-4">
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>Thú cưng</option>
                  <option>Du lịch</option>
                  <option>Công nghệ</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Nhập từ khóa bạn muốn (tối đa 20 từ)..."
                  className="w-full p-2 border rounded"
                  id="my-prompt"
                  value={scriptInput}
                  onChange={event => setScriptInput(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Phong cách</label>
            <div className="relative w-full">
              <select className="w-full p-2 border rounded appearance-none pr-10">
                <option>Phổ thông</option>
                <option>Hài hước</option>
                <option>Chính thống</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          <Button id="prompt-button" className="w-full bg-black text-white" onClick={onGenerateContent}>Tạo kịch bản</Button>

          <h2 className="text-xl font-bold my-6">Tùy chỉnh âm thanh</h2>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Ngôn ngữ</label>
            <div className="flex gap-4 items-center">
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>Tiếng Anh</option>
                  <option>Tiếng Việt</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>Nam, người lớn</option>
                  <option>Nữ, người lớn</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
              <Button variant="ghost" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Thêm giọng nói
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Tốc độ đọc</label>
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>1.0x</option>
                  <option>1.5x</option>
                  <option>2.0x</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium">Âm điệu</label>
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>Vui nhộn</option>
                  <option>Nghiêm túc</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-medium">Cường độ</label>
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10">
                  <option>100%</option>
                  <option>75%</option>
                  <option>50%</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
            </div>
          </div>

          <Button id="voice-button" className="w-full bg-black text-white" onClick={onGenerateSound}>Tạo giọng nói</Button>
        </div>

        {/* Right column - Preview */}
        <div className="flex flex-col gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Kịch bản được tạo</h2>
            <textarea id="my-text-area" className="w-full bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto text-sm" value={scriptOutput} onChange={() => {}}>
            </textarea>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Âm thanh được tạo</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 ml-1" onClick={async () => {

                  await audio.play()
                }}/>
              </div>
              <div className="flex-1">
                <div className="h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {/* Audio waveform visualization */}
                  <div className="flex items-end h-10 gap-[2px] px-4 w-full">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gray-500"
                        style={{
                          height: `${Math.max(4, Math.floor(Math.random() * 40))}px`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>02:10 / 12:30</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
                <div className="absolute left-0 top-0 bottom-0 w-1/6 bg-black rounded-full"></div>
                <div className="absolute h-3 w-3 bg-white border-2 border-black rounded-full top-1/2 left-1/6 transform -translate-y-1/2 -translate-x-1/2"></div>
              </div>
            </div>

            {/*<AudioPlayer*/}
            {/*    autoPlay*/}
            {/*    src={audio_source}*/}
            {/*    onPlay={(e) => {e.preventDefault(); console.log("onPlay")}}*/}
            {/*    // other props here*/}
            {/*/>*/}
          </div>

          <div className="flex justify-end gap-4 mt-auto">
            <span className="text-center justify-self-center content-center">{progress}</span>
            <Button variant="outline" className="px-6" onClick={onCancel}>
              Hủy bản phác thảo
            </Button>
            <Button className="bg-black text-white px-6" onClick={
              async () => {
                await onGenerateImagesAndVoiceWithScript()
                onApproveAndCreate()
              }
            }>
              Phê duyệt và tạo ảnh
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

