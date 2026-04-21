import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface AvatarUploadProps {
  name: string;
  imageUrl?: string;
  onImageChange: (file: File, previewUrl: string) => void;
}

export function AvatarUpload({ name, imageUrl, onImageChange }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onImageChange(file, previewUrl);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative group">
        <AvatarDisplay name={name} imageUrl={imageUrl} size="xl" />
        
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 text-gray-700 hover:text-[#CD0000] transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
        >
          <span className="text-white text-xs font-bold flex flex-col items-center gap-1">
            <Upload className="w-5 h-5" />
            Change Picture
          </span>
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
