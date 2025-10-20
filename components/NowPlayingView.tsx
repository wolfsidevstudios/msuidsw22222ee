import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { ChevronDownIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

// AI-POWERED LYRICS FEATURE: Add Gemini API integration
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY is not set. Lyrics generation will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

interface LyricLine {
  time: number;
  text: string;
}

const parseLyrics = (lyricText: string): LyricLine[] => {
    if (!lyricText) return [];
    const lines = lyricText.split('\n');
    const parsed: LyricLine[] = [];
    const regex = /\[(\d{2}):(\d{2}):(\d{2})\.(\d{3})\]\s*(.*)/;

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const [, minutes, seconds, ms, text] = match;
            const time = parseInt(minutes, 10) * 60 + parseInt(seconds, 10) + parseInt(ms, 10) / 1000;
            if (text.trim()) {
               parsed.push({ time, text: text.trim() });
            }
        }
    }
    return parsed;
};


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
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [lyricsStatus, setLyricsStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

    const videoRef = useRef<HTMLVideoElement>(null);
    const activeLyricRef = useRef<HTMLLIElement>(null);
    const lyricsContainerRef = useRef<HTMLUListElement>(null);

    // Effect for fetching lyrics
    useEffect(() => {
        if (!track || !ai) return;

        const generateLyrics = async () => {
            setLyricsStatus('loading');
            setLyrics([]);
            setCurrentLyricIndex(-1);
            try {
                const prompt = `Generate karaoke-style lyrics for the song titled "${track.name}". Provide timestamps in the format [mm:ss.SSS] for each line. Ensure every line with text has a timestamp.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                const parsed = parseLyrics(response.text);
                if (parsed.length > 0) {
                    setLyrics(parsed);
                    setLyricsStatus('success');
                } else {
                    setLyricsStatus('error');
                }
            } catch (error) {
                console.error("Error generating lyrics:", error);
                setLyricsStatus('error');
            }
        };

        generateLyrics();
    }, [track]);

    // Effect for handling media URLs
    useEffect(() => {
        let artUrl = '';
        if (track.coverArt) {
            artUrl = URL.createObjectURL(track.coverArt);
            setCoverArtUrl(artUrl);
        } else setCoverArtUrl('');
        
        let vidUrl = '';
        if (track.video) {
            vidUrl = URL.createObjectURL(track.video);
            setVideoUrl(vidUrl);
        } else setVideoUrl('');

        return () => {
            if (artUrl) URL.revokeObjectURL(artUrl);
            if (vidUrl) URL.revokeObjectURL(vidUrl);
        }
    }, [track]);


    // Effect for controlling video playback
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if (isPlaying && video.paused) {
                video.play().catch(e => console.error("Video play error:", e));
            } else if (!isPlaying && !video.paused) {
                video.pause();
            }
        } catch (e) { console.error("Video play/pause error:", e) }
    }, [isPlaying, videoUrl]);
    
    // Effect for syncing video time (less aggressive)
    useEffect(() => {
        const video = videoRef.current;
        if (video && Math.abs(video.currentTime - currentTime) > 1) {
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    // Effect for updating lyric highlighting
    useEffect(() => {
        const newIndex = lyrics.findIndex((line, index) => {
            const nextLine = lyrics[index + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
        if (newIndex !== currentLyricIndex) {
            setCurrentLyricIndex(newIndex);
        }
    }, [currentTime, lyrics, currentLyricIndex]);

    // Effect for scrolling active lyric into view
    useEffect(() => {
        if (activeLyricRef.current && lyricsContainerRef.current) {
            activeLyricRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentLyricIndex]);

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const LyricsDisplay = () => {
        if (lyricsStatus === 'loading') {
            return <div className="text-gray-400 text-center animate-pulse">Generating lyrics...</div>;
        }
        if (lyricsStatus === 'error' || lyrics.length === 0) {
            return <div className="text-gray-500 text-center">Lyrics not available for this track.</div>;
        }
        return (
            <ul ref={lyricsContainerRef} className="h-full overflow-y-auto text-center space-y-4 scroll-smooth no-scrollbar">
                {/* Padding elements to center the first and last lines */}
                <li className="h-[40%]"></li>
                {lyrics.map((line, index) => {
                    const isActive = index === currentLyricIndex;
                    return (
                        <li
                            key={index}
                            ref={isActive ? activeLyricRef : null}
                            className={`transition-all duration-300 ease-in-out ${
                                isActive
                                ? 'text-white font-bold text-2xl md:text-3xl'
                                : 'text-gray-400/80 font-medium text-lg md:text-xl'
                            }`}
                        >
                            {line.text}
                        </li>
                    );
                })}
                <li className="h-[40%]"></li>
            </ul>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center overflow-hidden">
            {/* Background */}
            {videoUrl ? (
                 <video ref={videoRef} src={videoUrl} loop muted className="absolute w-full h-full object-cover"/>
            ) : coverArtUrl ? (
                <div className="absolute w-full h-full bg-cover bg-center transform scale-110 blur-3xl opacity-40" style={{ backgroundImage: `url(${coverArtUrl})` }} />
            ) : (
                <div className="absolute w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800" />
            )}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>

            {/* Content */}
            <div className="relative w-full h-full flex flex-col p-4 md:p-6 text-white font-sans">
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronDownIcon className="w-7 h-7" />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">Now Playing</p>
                    </div>
                    <div className="w-11 h-11"/>
                </header>
                
                {/* Main Content: Responsive Layout */}
                <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 min-h-0 my-4">
                    {/* Cover Art (Left on Desktop) */}
                    <div className="w-full max-w-xs md:max-w-md lg:max-w-lg aspect-square flex-shrink-0">
                        {coverArtUrl ? (
                            <img src={coverArtUrl} alt={track.name} className="w-full h-full object-cover rounded-lg shadow-2xl"/>
                        ) : (
                            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center shadow-2xl">
                                <span className="material-symbols-outlined text-9xl text-gray-500">music_note</span>
                            </div>
                        )}
                    </div>

                    {/* Info, Lyrics & Controls (Right on Desktop) */}
                    <div className="w-full md:w-1/2 flex flex-col justify-between h-full max-h-full min-h-0 text-center md:text-left">
                        <div className="flex-shrink-0">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white truncate">{track.name}</h2>
                            <p className="text-lg text-gray-300 mt-1">Local File</p>
                        </div>
                        <div className="flex-grow my-4 h-32 md:h-auto min-h-0">
                            <LyricsDisplay />
                        </div>
                        <div className="w-full max-w-lg mx-auto md:mx-0">
                            <div className="w-full bg-white/20 rounded-full h-1.5 group relative">
                                <div className="bg-spotify-green h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                <div className="absolute -top-1 h-3.5 w-3.5 bg-white rounded-full transition-opacity opacity-0 group-hover:opacity-100" style={{ left: `calc(${progress}% - 7px)` }}></div>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 1}
                                    value={currentTime}
                                    onChange={(e) => onSeek(Number(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    aria-label="Seek slider"
                                />
                            </div>
                            <div className="flex justify-between text-xs font-medium mt-1.5 text-gray-300">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NowPlayingView;
