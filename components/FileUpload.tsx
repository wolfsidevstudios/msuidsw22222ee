import React, { useRef } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(event.target.files);
      event.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-black rounded-full border border-gray-600 hover:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        <span>{isLoading ? 'Processing...' : 'Add Music'}</span>
      </button>
    </div>
  );
};

export default FileUpload;