import React from 'react';

interface UploadOverlayProps {
  isVisible: boolean;
}

const UploadOverlay: React.FC<UploadOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
      <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-spotify-green rounded-xl text-white">
        <span className="material-symbols-outlined text-8xl mb-4 text-spotify-green">upload_file</span>
        <h2 className="text-3xl font-bold">Drop Your Music Here</h2>
        <p className="mt-2 text-lg text-gray-300">Add songs to your library instantly</p>
      </div>
    </div>
  );
};

export default UploadOverlay;