"use client"
import { ChevronDown, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-h5-audio-player/lib/styles.css';

interface ContentCreationProps {
  onApproveAndCreate: () => void
  onCancel: () => void
  onContinue: () => void
  imageVibe: string
  setImageVibe: (imageVibe: string) => void
  voiceLanguage: string
  setVoiceLanguage: (voiceLanguage: string) => void
}

interface ImageItem {
  asset_id: number,
  image_url: string,
  script: string,
  audio_url: string,

  // Support upload/record audio
  custom_audio?: File | Blob,
  custom_audio_url?: string
}

export default function ContentCreation({ onApproveAndCreate, onCancel, onContinue, imageVibe, setImageVibe, voiceLanguage, setVoiceLanguage }: ContentCreationProps) {
  const [assetsExist, setAssetsExist] = useState(false);

  const [scriptOutput, setScriptOutput] = useState("");
  const [scriptInput, setScriptInput] = useState("");
  const [scriptFileName, setScriptFileName] = useState("");
  const [scriptFile, setScriptFile] = useState("");
  const [scriptLink, setScriptLink] = useState("");

  const [progress, setProgress] = useState("");
  const [scriptVibe, setScriptVibe] = useState("Casual");
  
  const [scriptInputType, setScriptInputType] = useState("manual");
  
  const [assets, setAssets] = useState<ImageItem[]>([
    // {asset_id: 0, image_url: "", script: "An apple", audio_url: "sounds/output.mp3"}
    // {asset_id: 1, image_url: "", script: "A pineapple", audio_url: "sounds/output.mp3"},
    // {asset_id: 2, image_url: "", script: "Grapes", audio_url: "sounds/output.mp3"}
  ])

  useEffect(() => {
    const checkAssets = async () => {
      const response = await fetch('api/assets_data')
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Assets don't exist")
          setAssetsExist(false)
        }
        else
          console.log("Something wrong happened")
      } 
      else
        setAssetsExist(true)
    };
    checkAssets();
  }, []);


  const onGenerateContent = async () => {
    let promptArea = document.getElementById("my-text-area")
    let promptButton = document.getElementById("prompt-button")
    // let promptGet = document.getElementById("my-prompt")
    if (promptArea !== null && promptButton !== null) {
      try {
        promptButton.setAttribute("disabled", '');
        let response;

        if (scriptInputType == "manual"){
          response = await fetch('/api/script_generation/manual', {
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify({
              script: scriptInput,
              vibe: scriptVibe,
            })
          })
        }
        else if (scriptInputType == "link"){
          response = await fetch('/api/script_generation/link', {
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify({
              link: scriptLink,
              vibe: scriptVibe,
            })
          })
        }
        else if (scriptInputType == "file"){
          response = await fetch('/api/script_generation/file', {
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify({
              filename: scriptFileName,
              file: scriptFile,
              vibe: scriptVibe,
            })
          })
        }
        else {
          return;
        }

        let data = await response.json()

        if (response.ok) {
          let result = data.output.replaceAll(/\*/g, '')
          setScriptOutput(result)
        }
        else {
          setScriptOutput(data.error)
        }
        promptButton.removeAttribute("disabled");
      }
      catch (error) {

      }
    }

  }

  // const onGenerateSound = async () => {
  //   // let audio_player = document.getElementById("prompted-audio-player")
  //   // let audio = document.getElementById("prompted-audio")
  //   let voiceButton = document.getElementById("voice-button")
  //
  //   let script_input = scriptOutput;
  //   if (voiceButton !== null){
  //     try {
  //       voiceButton.setAttribute("disabled",'');
  //       const response = await fetch('/api/voice_generation', {
  //         method: 'POST',
  //         headers: {
  //           'Content-type': 'application/json'
  //         },
  //         body: JSON.stringify({body: script_input})
  //       })
  //
  //       if (response.ok){
  //         console.log("saved new")
  //         setAudioSource("sounds/output.wav")
  //         setAudioContent(new Audio(audio_source))
  //         audio.load()
  //       }
  //       else {
  //         setAudioSource("sounds/fly.wav")
  //         setAudioContent(new Audio(audio_source))
  //         audio.load()
  //       }
  //       voiceButton.removeAttribute("disabled");
  //     }
  //     catch (error){
  //       // xd
  //     }
  //   }

  // if (audio_player !== null){
  //   audio_player.play
  // }
  // }

  const onGenerateImagesAndVoiceWithScript = async () => {
    try {
      let prompt_text_area = document.getElementById("my-text-area");
      prompt_text_area && prompt_text_area.nodeValue ? setScriptOutput(prompt_text_area.nodeValue) : null;

      let asset_index = 0;
      let temp_array = scriptOutput.split("\.").filter((a) => a.trim().length !== 0).map((a) => { asset_index++; return { asset_id: asset_index, script: a, audio_url: "", image_url: "", custom_audio_url: "", audio_duration: 0} });
      setAssets(temp_array)
      console.log(temp_array);

      if (temp_array.length === 0) return;

      setProgress("Clearing previous assets...")
      const deleteResponse = await fetch('api/assets_data/clear_assets', {
        method: 'DELETE'
      })

      if (!deleteResponse.ok)
        return;

      for (const s of temp_array) {
        setProgress("Generating image " + (s.asset_id) + " out of " + (temp_array.length) + "...")
        const image_response = await fetch('/api/image_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            prompt_data: s.script,
            prompt_index: s.asset_id,
            prompt_style: imageVibe
          })
        })

        if (image_response.ok){
          let image_result = await image_response.json();
          s.image_url = image_result.output;
        }

        setProgress("Generating voice " + (s.asset_id) + " out of " + (temp_array.length) + "...")
        const voice_response = await fetch('/api/voice_generation', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            prompt_data: s.script,
            prompt_index: s.asset_id,
            prompt_lang: voiceLanguage
          })
        })

        if (voice_response.ok){
          let voice_result = await voice_response.json();
          s.audio_url = voice_result.output;
          s.audio_duration = voice_result.duration;
        }
      }

      setProgress("Saving data...")
      await fetch('/api/assets_data', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          my_assets: temp_array
        })
      })
      setProgress("Finished.")
    }
    catch (error) {
      setProgress("Error")
    }
  }

  const onGenerateVideo = async () => {
    setProgress("Generating Video... (might take a while)")

    await fetch('/api/video_generation', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        prompt_data: scriptOutput,
        prompt_style: imageVibe
      })
    })

    setProgress("Video done!")
  }

  const saveLocalFile = async (file: File) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (evt) {
      console.log(file.size);
      toast.success("File uploaded successfully");
      if (reader.result == null) return;
      let temp : string = reader.result.toString();
      setScriptFile(temp.split(',')[1])
    }
    reader.onerror = function (evt) {
      toast.error("File uploaded failed");
    }
  }

  return (
    <>
    <div className="container flex justify-between p-4 border-b">
        <div>
          {onCancel && (
            <Button variant="outline" className="px-6" onClick={onCancel}>
              Hủy bản phác thảo
            </Button>
          )}
        </div>
        <div>
          {assetsExist && (
            <Button variant="outline" className="px-6" onClick={onContinue}>
              Đến chỉnh sửa tài nguyên
            </Button>
          )}
        </div>
    </div>


    <div className="container mx-auto py-4 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Tùy chỉnh kịch bản</h2>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Nhập chủ đề tạo</label>
            <div className="flex gap-4">
              <div className="relative w-full">
              <select className="w-full p-2 border rounded appearance-none pr-10" onChange={event => {
                setScriptInputType(event.target.value);
                setScriptFileName("");
              }} value={scriptInputType}>
                <option value={"manual"}>Tự nhập</option>
                <option value={"file"}>Tải từ file</option>
                <option value={"link"}>Từ đường dẫn</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
              {
                scriptInputType == "manual" ?
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
                    : scriptInputType == "file" ?
                        <div>
                        <input type="file" value={scriptFileName} onChange={async event => {
                          if (event.target.files == null) return;
                          setScriptFileName(event.target.value);
                          const input_file = event.target.files[0];
                          if (input_file.size <= 10485760)
                            await saveLocalFile(input_file);
                          else
                            toast.error("File is larger than 10MB");
                        }}/>
                        </div>

                        : scriptInputType == "link" ? <div className="w-full">
                          <input
                              type="text"
                              placeholder="Nhập đường dẫn"
                              className="w-full p-2 border rounded"
                              id="my-prompt-link"
                              value={scriptLink}
                              onChange={event => setScriptLink(event.target.value)}
                          />
                        </div> : <></>
              }
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Phong cách</label>
            <div className="relative w-full">
              <select className="w-full p-2 border rounded appearance-none pr-10"
                      onChange={event => setScriptVibe(event.target.value)} value={scriptVibe}>
                <option value={"Casual"}>Phổ thông</option>
                <option value={"Comical"}>Hài hước</option>
                <option value={"Serious"}>Nghiêm túc</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          <Button id="prompt-button" className="w-full bg-black text-white" onClick={onGenerateContent}>Tạo kịch
            bản</Button>

          <h2 className="text-xl font-bold my-6">Tùy chỉnh âm thanh</h2>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Ngôn ngữ</label>
            <div className="flex gap-4 items-center">
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10" onChange={event => setVoiceLanguage(event.target.value)}>
                  <option value={"en"}>Tiếng Anh</option>
                  <option value={"vi"}>Tiếng Việt</option>
                  <option value={"jp"}>Tiếng Nhật</option>
                  <option value={"cn"}>Tiếng Trung</option>
                  <option value={"kr"}>Tiếng Hàn</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
              {/*<div className="relative w-full">*/}
              {/*  <select className="w-full p-2 border rounded appearance-none pr-10">*/}
              {/*    <option>Nam, người lớn</option>*/}
              {/*    <option>Nữ, người lớn</option>*/}
              {/*  </select>*/}
              {/*  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />*/}
              {/*</div>*/}
              {/*<Button variant="ghost" className="flex items-center gap-1">*/}
              {/*  <Plus className="h-4 w-4" />*/}
              {/*  Thêm giọng nói*/}
              {/*</Button>*/}
            </div>
          </div>

          <h2 className="text-xl font-bold my-6">Tùy chỉnh hình ảnh</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Phong cách</label>
              <div className="relative w-full">
                <select className="w-full p-2 border rounded appearance-none pr-10" onChange={event => setImageVibe(event.target.value)}>
                  <option value={"Realistic"}>Hiện thực</option>
                  <option value={"Cartoon"}>Hoạt hình</option>
                  <option value={"Painting"}>Tranh vẽ</option>
                  <option value={"Journalistic"}>Báo chí</option>
                  <option value={"Classical"}>Cổ điển</option>
                  <option value={"Historical"}>Lịch sử</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/*<Button id="voice-button" className="w-full bg-black text-white" onClick={onGenerateSound}>Tạo giọng nói</Button>*/}
        </div>

        {/* Right column - Preview */}
        <div className="flex flex-col gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Kịch bản được tạo</h2>
            <textarea id="my-text-area" className="w-full bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto text-sm"
              readOnly={false} value={scriptOutput} onChange={(event) => {
                setScriptOutput(event.target.value)
              }}>
            </textarea>
          </div>

          {/*<div className="border rounded-lg p-6">*/}
          {/*<h2 className="text-xl font-bold mb-4">Âm thanh được tạo</h2>*/}
          {/*<div className="flex items-center gap-4 mb-4">*/}
          {/*  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">*/}
          {/*    <Play className="h-8 w-8 ml-1" onClick={async () => {*/}
          {/*      await audio.play()*/}
          {/*    }}/>*/}
          {/*  </div>*/}
          {/*  <div className="flex-1">*/}
          {/*    <div className="h-16 bg-gray-200 rounded-lg flex items-center justify-center">*/}
          {/*      /!* Audio waveform visualization *!/*/}
          {/*      <div className="flex items-end h-10 gap-[2px] px-4 w-full">*/}
          {/*        {Array.from({ length: 50 }).map((_, i) => (*/}
          {/*          <div*/}
          {/*            key={i}*/}
          {/*            className="w-1 bg-gray-500"*/}
          {/*            style={{*/}
          {/*              height: `${Math.max(4, Math.floor(Math.random() * 40))}px`,*/}
          {/*            }}*/}
          {/*          ></div>*/}
          {/*        ))}*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<div className="flex items-center gap-2 text-sm text-gray-500">*/}
          {/*  <span>02:10 / 12:30</span>*/}
          {/*  <div className="flex-1 h-1 bg-gray-200 rounded-full relative">*/}
          {/*    <div className="absolute left-0 top-0 bottom-0 w-1/6 bg-black rounded-full"></div>*/}
          {/*    <div className="absolute h-3 w-3 bg-white border-2 border-black rounded-full top-1/2 left-1/6 transform -translate-y-1/2 -translate-x-1/2"></div>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<AudioPlayer*/}
          {/*    autoPlay*/}
          {/*    src={audio_source}*/}
          {/*    onPlay={(e) => {e.preventDefault(); console.log("onPlay")}}*/}
          {/*    // other props here*/}
          {/*/>*/}
          {/*</div>*/}

            <div className="flex justify-end gap-4 mt-auto">
              <span className="text-center justify-self-center content-center">{progress}</span>
              <Button variant="outline" className="px-6" onClick={async () => {
                if (scriptOutput.length === 0) {
                  toast.error("Khu vực kịch bản đang trống!")
                  return;
                }
                await onGenerateVideo();
              }}>
                Tạo video AI
              </Button>
              <Button className="bg-black text-white px-6" onClick={
                async () => {
                  if (scriptOutput.length === 0) {
                    toast.error("Khu vực kịch bản đang trống!")
                    return;
                  }
                  await onGenerateImagesAndVoiceWithScript()
                  onApproveAndCreate()
                }
              }>
                Phê duyệt và tạo ảnh
              </Button>
            </div>
          </div>
        </div>
        <ToastContainer/>
      </div>
      </>
  )
}
