
import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { EditIcon } from './icons';

interface LibraryProps {
  tracks: Track[];
  currentTrackId: number | null;
  isPlaying: boolean;
  onTrackSelect: (id: number) => void;
  onTrackDelete: (id: number) => void;
  onTrackEditRequest: (id: number) => void;
}

interface TrackListItemProps {
    track: Track;
    isActive: boolean;
    isPlaying: boolean;
    onTrackSelect: (id: number) => void;
    onTrackDelete: (id: number) => void;
    onTrackEditRequest: (id: number) => void;
}

const TrackListItem: React.FC<TrackListItemProps> = ({ track, isActive, isPlaying, onTrackSelect, onTrackDelete, onTrackEditRequest }) => {
    const [coverArtUrl, setCoverArtUrl] = useState('');

    useEffect(() => {
        let url = '';
        if (track.coverArt) {
            url = URL.createObjectURL(track.coverArt);
            setCoverArtUrl(url);
        } else {
            setCoverArtUrl('');
        }
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [track.coverArt]);

    const handleTrackDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTrackDelete(track.id);
    }
    
    const handleTrackEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTrackEditRequest(track.id);
    }

    return (
        <li
            onClick={() => onTrackSelect(track.id)}
            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors duration-200 group ${
            isActive ? 'bg-gray-700/50' : 'hover:bg-gray-800/60'
            }`}
            aria-current={isActive ? 'true' : 'false'}
        >
            <div className="flex items-center space-x-4 overflow-hidden">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-800 rounded-md overflow-hidden">
                {isActive && isPlaying ? (
                    <div className="w-5 h-5 flex justify-between items-end">
                        <span className="w-1 bg-spotify-green animate-audiowave" style={{animationDelay: '0s'}}></span>
                        <span className="w-1 bg-spotify-green animate-audiowave" style={{animationDelay: '0.3s'}}></span>
                        <span className="w-1 bg-spotify-green animate-audiowave" style={{animationDelay: '0.6s'}}></span>
                    </div>
                ) : coverArtUrl ? (
                    <img src={coverArtUrl} alt={track.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="material-symbols-outlined text-2xl text-gray-400">music_note</span>
                )}
                </div>
                <span className={`font-medium truncate ${isActive ? 'text-spotify-green' : 'text-gray-200'}`}>{track.name}</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTrackSelect(track.id)
                    }}
                    className="p-3 rounded-full bg-spotify-green text-black opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-spotify-green flex items-center justify-center transform hover:scale-110"
                    aria-label={`Play ${track.name}`}
                >
                    <span className="material-symbols-outlined text-2xl">play_arrow</span>
                </button>
                <button
                    onClick={handleTrackEdit}
                    className="p-2 rounded-full hover:bg-gray-700/80 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Edit ${track.name}`}
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleTrackDelete}
                    className="p-2 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete ${track.name}`}
                >
                    <span className="material-symbols-outlined text-xl">delete</span>
                </button>
            </div>
        </li>
    );
};


const Library: React.FC<LibraryProps> = ({ tracks, currentTrackId, isPlaying, onTrackSelect, onTrackDelete, onTrackEditRequest }) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
        <span className="material-symbols-outlined text-8xl mb-4 text-gray-600">music_off</span>
        <h2 className="text-2xl font-bold text-gray-400">Your Library is Empty</h2>
        <p className="mt-2 text-center text-gray-500">Drag & drop songs here or use the 'Add Music' button.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul>
        {tracks.map((track) => {
          const isActive = track.id === currentTrackId;
          return (
            <TrackListItem
              key={track.id}
              track={track}
              isActive={isActive}
              isPlaying={isPlaying}
              onTrackSelect={onTrackSelect}
              onTrackDelete={onTrackDelete}
              onTrackEditRequest={onTrackEditRequest}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default Library;
