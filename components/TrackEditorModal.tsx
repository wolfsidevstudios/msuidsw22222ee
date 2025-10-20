import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { XMarkIcon, PhotoIcon, VideoCameraIcon } from './icons';

interface TrackEditorModalProps {
  track: Track;
  onSave: (updatedData: { id: number; coverArt?: File; video?: File }) => void;
  onClose: () => void;
}

const TrackEditorModal: React.FC<TrackEditorModalProps> = ({ track, onSave, onClose }) => {
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');

  const coverArtInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let artUrl = '';
    if (track.coverArt) {
      artUrl = URL.createObjectURL(track.coverArt);
      setCoverArtPreview(artUrl);
    }
    let vidUrl = '';
    if (track.video) {
        vidUrl = URL.createObjectURL(track.video);
        setVideoPreview(vidUrl);
    }
    return () => {
      if (artUrl) URL.revokeObjectURL(artUrl);
      if (vidUrl) URL.revokeObjectURL(vidUrl);
    };
  }, [track]);

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArtFile(file);
      setCoverArtPreview(URL.createObjectURL(file));
    }
  };
  
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    onSave({
      id: track.id,
      coverArt: coverArtFile || undefined,
      video: videoFile || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Edit Track</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
            <div className='text-center'>
                <p className='text-xl font-bold text-spotify-green'>{track.name}</p>
                <p className='text-sm text-gray-400'>Add your visuals</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cover Art Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cover Art</label>
                    <div 
                        onClick={() => coverArtInputRef.current?.click()}
                        className="aspect-square bg-gray-900/50 rounded-md cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-spotify-green transition-colors"
                    >
                        {coverArtPreview ? (
                            <img src={coverArtPreview} alt="Cover art preview" className="w-full h-full object-cover rounded-md"/>
                        ) : (
                            <div className="text-center text-gray-400">
                                <PhotoIcon className="w-10 h-10 mx-auto"/>
                                <span className="mt-2 text-xs">Click to upload image</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={coverArtInputRef} onChange={handleCoverArtChange} className="hidden" />
                    </div>
                </div>

                {/* Video Upload */}
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Video (9:16)</label>
                    <div 
                        onClick={() => videoInputRef.current?.click()}
                        className="aspect-[9/16] bg-gray-900/50 rounded-md cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-spotify-green transition-colors"
                    >
                        {videoPreview ? (
                            <video src={videoPreview} muted className="w-full h-full object-cover rounded-md"/>
                        ) : (
                            <div className="text-center text-gray-400 p-2">
                                <VideoCameraIcon className="w-10 h-10 mx-auto"/>
                                <span className="mt-2 text-xs">Click to upload video</span>
                            </div>
                        )}
                        <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoChange} className="hidden" />
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-black bg-spotify-green rounded-full hover:scale-105 transition-transform">Save</button>
        </div>
      </div>
    </div>
  );
};

export default TrackEditorModal;