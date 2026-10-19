'use client'

import { UploadCloud, X } from 'lucide-react'

interface Step4MediaProps {
  imageFiles: File[]
  setImageFiles: React.Dispatch<React.SetStateAction<File[]>>
}

export default function Step4Media({ imageFiles, setImageFiles }: Step4MediaProps) {
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="border-[1.5px] border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 cursor-pointer relative hover:bg-gray-100 transition-colors">
        <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <UploadCloud className="w-12 h-12 text-[#005C3A] mb-3 opacity-80" />
        <p className="text-[15px] font-bold text-[#091F11]">Upload images</p>
        <p className="text-[11px] text-gray-500 mt-1">High quality photos (Max 10MB each)</p>
      </div>
      
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {imageFiles.map((file, index) => (
            <div key={index} className="aspect-square rounded-xl bg-gray-200 overflow-hidden relative shadow-sm group">
              <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}