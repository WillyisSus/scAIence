"use client"
import { ChevronDown, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContentCreationProps {
  onApproveAndCreate: () => void
  onCancel: () => void
}

export default function ContentCreation({ onApproveAndCreate, onCancel }: ContentCreationProps) {
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

          <Button className="w-full bg-black text-white">Áp dụng</Button>

          <h2 className="text-xl font-bold my-6">Tùy chỉnh âm thanh</h2>

          <div className="mb-6">
            <label className="block mb-2 font-medium">Giọng đọc</label>
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

          <Button className="w-full bg-black text-white">Áp dụng</Button>
        </div>

        {/* Right column - Preview */}
        <div className="flex flex-col gap-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Kịch bản được tạo</h2>
            <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
              <br />
              <br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
              <br />
              <br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Âm thanh được tạo</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 ml-1" />
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
          </div>

          <div className="flex justify-end gap-4 mt-auto">
            <Button variant="outline" className="px-6" onClick={onCancel}>
              Hủy bản phác thảo
            </Button>
            <Button className="bg-black text-white px-6" onClick={onApproveAndCreate}>
              Phê duyệt và tạo ảnh
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

