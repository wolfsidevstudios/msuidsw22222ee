import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { ChevronDownIcon } from './icons';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

const NowPlayingView: React.FC<PlayerProps> = ({ track, isPlaying, duration, currentTime, onPlayPause, onNext, onPrev, onSeek, onClose }) => {
    const [coverArtUrl, setCoverArtUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let artUrl = '';
        if (track.coverArt) {
            artUrl = URL.createObjectURL(track.coverArt);
            setCoverArtUrl(artUrl);
        } else {
            setCoverArtUrl('');
        }
        
        let vidUrl = '';
        if (track.video) {
            vidUrl = URL.createObjectURL(track.video);
            setVideoUrl(vidUrl);
        } else {
            setVideoUrl('');
        }

        return () => {
            if (artUrl) URL.revokeObjectURL(artUrl);
            if (vidUrl) URL.revokeObjectURL(vidUrl);
        }
    }, [track]);


    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (isPlaying) {
                video.play();
            } else {
                video.pause();
            }
        } catch (e) {
            console.error("Video play/pause error:", e)
        }
    }, [isPlaying, videoUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (video && Math.abs(video.currentTime - currentTime) > 0.5) {
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center overflow-hidden">
            {/* Background */}
            {videoUrl ? (
                 <video ref={videoRef} src={videoUrl} loop muted className="absolute w-full h-full object-cover"/>
            ) : coverArtUrl ? (
                <div className="absolute w-full h-full bg-cover bg-center transform scale-110 blur-2xl opacity-50" style={{ backgroundImage: `url(${coverArtUrl})` }} />
            ) : (
                <div className="absolute w-full h-full bg-gray-900" />
            )}
            <div className="absolute inset-0 bg-black/60"/>

            {/* Content */}
            <div className="relative w-full h-full flex flex-col p-4 md:p-8 text-white">
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <ChevronDownIcon className="w-7 h-7" />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-300">NOW PLAYING</p>
                        <p className="font-bold text-white truncate max-w-[200px] md:max-w-xs">{track.name}</p>
                    </div>
                    <div className="w-11 h-11"/>
                </header>

                {/* Visualizer */}
                <main className="flex-grow flex items-center justify-center my-4">
                    {coverArtUrl ? (
                        <img src={coverArtUrl} alt={track.name} className="max-w-full max-h-full aspect-square rounded-lg shadow-2xl"/>
                    ) : (
                        <div className="w-full max-w-sm aspect-square bg-gray-800 rounded-lg flex items-center justify-center shadow-2xl">
                            <span className="material-symbols-outlined text-9xl text-gray-500">music_note</span>
                        </div>
                    )}
                </main>

                {/* Controls */}
                <footer className="flex-shrink-0 flex flex-col items-center w-full max-w-lg mx-auto">
                    <div className="w-full">
                        <div className="w-full bg-white/20 rounded-full h-1.5 group relative">
                            <div className="bg-spotify-green h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                             <div className="absolute -top-1 h-3.5 w-3.5 bg-white rounded-full transition-opacity opacity-0 group-hover:opacity-100" style={{ left: `calc(${progress}% - 7px)` }}></div>
                            <input
                                type="range"
                                min="0"
                                max={duration || 1}
                                value={currentTime}
                                onChange={(e) => onSeek(Number(e.target.value))}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Seek slider"
                            />
                        </div>
                        <div className="flex justify-between text-xs font-medium mt-1.5 text-gray-300">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-6 mt-4">
                        <button onClick={onPrev} className="text-gray-300 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-4xl">skip_previous</span>
                        </button>
                        <button
                            onClick={onPlayPause}
                            className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:bg-white transition-all transform hover:scale-105 duration-200"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <span className="material-symbols-outlined text-5xl">pause</span> : <span className="material-symbols-outlined text-5xl">play_arrow</span>}
                        </button>
                        <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-4xl">skip_next</span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default NowPlayingView;
