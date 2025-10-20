import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { ChevronUpIcon, BluetoothIcon, BluetoothConnectedIcon } from './icons';

interface PlayerProps {
  track: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onExpand: () => void;
  isBluetoothSupported: boolean;
  isBluetoothConnected: boolean;
  onBluetoothConnect: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
    track, isPlaying, duration, currentTime, volume, 
    onPlayPause, onNext, onPrev, onSeek, onVolumeChange, onExpand,
    isBluetoothSupported, isBluetoothConnected, onBluetoothConnect 
}) => {
  const [coverArtUrl, setCoverArtUrl] = useState('');

  useEffect(() => {
      let url = '';
      if (track?.coverArt) {
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
  }, [track]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleVolumeToggle = () => {
    onVolumeChange(volume > 0 ? 0 : 0.75);
  };

  return (
    <div className="bg-black text-white p-2 md:p-4 grid grid-cols-[1fr_auto] grid-rows-2 md:grid-rows-1 md:grid-cols-3 items-center gap-x-4 gap-y-1 md:gap-y-0 shadow-t-lg border-t border-gray-800">
      {/* Track Info */}
      <div className="flex items-center col-start-1 row-start-1">
         <button 
            onClick={onExpand} 
            disabled={!track} 
            className="flex items-center space-x-2 md:space-x-4 overflow-hidden text-left disabled:cursor-not-allowed group"
            aria-label="Expand player view"
         >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-800 rounded-md flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden relative">
              {coverArtUrl ? (
                <img src={coverArtUrl} alt={track?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-3xl md:text-4xl text-gray-400">music_note</span>
              )}
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                  <ChevronUpIcon className="w-8 h-8"/>
               </div>
            </div>
            <div>
              <p className="font-semibold text-xs md:text-sm truncate text-white">{track?.name || 'No song playing'}</p>
              {track && <p className="text-xs text-gray-400">Local File</p>}
            </div>
        </button>
      </div>

      {/* Playback Controls & Seekbar */}
      <div className="flex flex-col items-center justify-center w-full col-span-2 md:col-span-1 row-start-2 md:row-start-1 md:col-start-2">
        <div className="flex items-center space-x-4 md:space-x-6">
          <button onClick={onPrev} disabled={!track} className="text-gray-400 hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-2xl md:text-3xl">skip_previous</span>
          </button>
          <button
            onClick={onPlayPause}
            disabled={!track}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white text-black hover:bg-white transition-all transform hover:scale-105 duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:scale-100"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <span className="material-symbols-outlined text-3xl md:text-4xl">pause</span> : <span className="material-symbols-outlined text-3xl md:text-4xl">play_arrow</span>}
          </button>
          <button onClick={onNext} disabled={!track} className="text-gray-400 hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-2xl md:text-3xl">skip_next</span>
          </button>
        </div>
        <div className="hidden md:flex items-center space-x-2 w-full mt-2">
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(currentTime)}</span>
            <div className="w-full bg-gray-700 rounded-full h-1 group relative">
                <div className="bg-spotify-green h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={!track}
                    aria-label="Seek slider"
                />
            </div>
            <span className="text-xs text-gray-400 w-10 text-center">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Volume & Device Controls */}
      <div className="flex items-center justify-end space-x-3 row-start-1 col-start-2 md:col-start-3">
        {isBluetoothSupported && (
            <button 
                onClick={onBluetoothConnect} 
                className={`transition-colors ${isBluetoothConnected ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-white'}`}
                title={isBluetoothConnected ? 'Disconnect from Bluetooth device' : 'Connect to Bluetooth device'}
            >
                {isBluetoothConnected ? <BluetoothConnectedIcon className="w-5 h-5"/> : <BluetoothIcon className="w-5 h-5"/>}
            </button>
        )}
        <button onClick={handleVolumeToggle} className="text-gray-400 hover:text-white transition-colors">
            {volume > 0 ? <span className="material-symbols-outlined">volume_up</span> : <span className="material-symbols-outlined">volume_off</span>}
        </button>
        <div className="w-24 bg-gray-700 rounded-full h-1 group relative hidden md:block">
             <div className="bg-spotify-green h-1 rounded-full" style={{ width: `${volume * 100}%` }}></div>
             <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Volume slider"
            />
        </div>
      </div>
      
      {/* Mobile Seekbar */}
      <div className="md:hidden flex items-center space-x-2 w-full col-span-2 row-start-2 -mt-2">
         <span className="text-[10px] text-gray-400 w-9 text-center">{formatTime(currentTime)}</span>
          <div className="w-full bg-gray-700 rounded-full h-1 group relative">
              <div className="bg-spotify-green h-1 rounded-full" style={{ width: `${progress}%` }}></div>
              <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!track}
                  aria-label="Seek slider"
              />
          </div>
          <span className="text-[10px] text-gray-400 w-9 text-center">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default Player;