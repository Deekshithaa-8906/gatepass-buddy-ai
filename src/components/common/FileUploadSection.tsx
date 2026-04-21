import React, { useRef } from 'react';
import { UploadCloud, File, X, FileImage, FileText } from 'lucide-react';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FileUploadSectionProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export function FileUploadSection({ files, onChange }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: UploadedFile[] = Array.from(selected).map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    onChange([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    onChange(files.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-gray-900 ml-1">Supporting Documents</label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 hover:border-[#CD0000] rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="bg-[#CD0000]/10 p-3 rounded-full mb-3">
          <UploadCloud className="w-6 h-6 text-[#CD0000]" />
        </div>
        <p className="text-gray-800 font-bold">Click to upload or drag and drop</p>
        <p className="text-gray-500 text-sm mt-1">SVG, PNG, JPG, PDF or DOCX (max. 5MB)</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 mt-4">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-gray-900 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 font-medium">{formatSize(file.size)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}
