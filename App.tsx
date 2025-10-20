
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from './types';
import { getAllTracksFromDB, addTrackToDB, deleteTrackFromDB, updateTrackInDB } from './services/db';
import Library from './components/Library';
import Player from './components/Player';
import FileUpload from './components/FileUpload';
import UploadOverlay from './components/UploadOverlay';
import TrackEditorModal from './components/TrackEditorModal';
import NowPlayingView from './components/NowPlayingView';


const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // New state for modals
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [isNowPlayingVisible, setIsNowPlayingVisible] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string>('');

  useEffect(() => {
    const loadTracks = async () => {
      const dbTracks = await getAllTracksFromDB();
      setTracks(dbTracks);
    };
    loadTracks();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrackUrl) {
        audioRef.current.src = currentTrackUrl;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    }
  }, [currentTrackUrl]);

  useEffect(() => {
      return () => {
          if (currentTrackUrl) {
              URL.revokeObjectURL(currentTrackUrl);
          }
      };
  }, [currentTrackUrl]);

  const handleFilesSelected = async (files: FileList) => {
    setIsUploading(true);
    try {
      const newTracksPromises = Array.from(files).map(async (file) => {
        const trackData = { name: file.name.replace(/\.[^/.]+$/, ""), file };
        const id = await addTrackToDB(trackData);
        return { ...trackData, id, file };
      });
      const newTracks = await Promise.all(newTracksPromises);
      setTracks(prevTracks => [...prevTracks, ...newTracks]);
    } catch (error) {
      console.error("Failed to add tracks:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleTrackDelete = async (id: number) => {
    if (id === currentTrackId) {
        setIsPlaying(false);
        setCurrentTrackId(null);
        if (audioRef.current) audioRef.current.src = '';
        if (currentTrackUrl) {
            URL.revokeObjectURL(currentTrackUrl);
            setCurrentTrackUrl('');
        }
        setIsNowPlayingVisible(false);
    }
    await deleteTrackFromDB(id);
    setTracks(tracks.filter(track => track.id !== id));
  };

  const handlePlayPause = useCallback(() => {
      if (!currentTrackId) return;
      setIsPlaying(prev => !prev);
  }, [currentTrackId]);

  const handleTrackSelect = useCallback((id: number) => {
      const track = tracks.find(t => t.id === id);
      if (track && track.id !== currentTrackId) {
        if (currentTrackUrl) {
            URL.revokeObjectURL(currentTrackUrl);
        }
        setCurrentTrackId(id);
        const url = URL.createObjectURL(track.file);
        setCurrentTrackUrl(url);
        setIsPlaying(true);
      } else if (track && track.id === currentTrackId) {
        handlePlayPause();
      }
  }, [tracks, currentTrackId, currentTrackUrl, handlePlayPause]);
  
  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying && currentTrackId) {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, currentTrackId]);

  const playNextTrack = useCallback(() => {
      if (tracks.length === 0) return;
      if (tracks.length === 1 && currentTrackId === tracks[0].id) {
          if(audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
          return;
      }
      const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
      const nextIndex = (currentIndex + 1) % tracks.length;
      handleTrackSelect(tracks[nextIndex].id);
  }, [tracks, currentTrackId, handleTrackSelect]);

  const playPrevTrack = useCallback(() => {
      if (tracks.length < 2) return;
      const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      handleTrackSelect(tracks[prevIndex].id);
  }, [tracks, currentTrackId, handleTrackSelect]);
  
  const handleSeek = (time: number) => {
      if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }
  }

  const handleDragEvents = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
      handleDragEvents(e);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDragging(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      handleDragEvents(e);
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
          return;
      }
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      handleDragEvents(e);
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
          handleFilesSelected(files);
      }
  };

  // Editor and Now Playing Handlers
  const handleTrackEditRequest = (id: number) => {
      setEditingTrackId(id);
  };
  
  const handleEditorSave = async (updatedData: { id: number, coverArt?: File, video?: File }) => {
    const originalTrack = tracks.find(t => t.id === updatedData.id);
    if (!originalTrack) return;

    const updatedTrack: Track = { 
        ...originalTrack,
        coverArt: updatedData.coverArt || originalTrack.coverArt,
        video: updatedData.video || originalTrack.video
     };

    await updateTrackInDB(updatedTrack);
    setTracks(prevTracks => prevTracks.map(t => t.id === updatedData.id ? updatedTrack : t));
    setEditingTrackId(null);
  };

  const currentTrack = tracks.find(t => t.id === currentTrackId) || null;
  const editingTrack = tracks.find(t => t.id === editingTrackId) || null;

  return (
    <div 
        className="h-screen bg-gray-900 text-white flex flex-col font-sans antialiased"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <UploadOverlay isVisible={isDragging} />
      {editingTrack && (
        <TrackEditorModal 
            track={editingTrack}
            onSave={handleEditorSave}
            onClose={() => setEditingTrackId(null)}
        />
      )}
      {isNowPlayingVisible && currentTrack && (
        <NowPlayingView
            track={currentTrack}
            isPlaying={isPlaying}
            duration={duration}
            currentTime={currentTime}
            volume={volume}
            onPlayPause={handlePlayPause}
            onNext={playNextTrack}
            onPrev={playPrevTrack}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onClose={() => setIsNowPlayingVisible(false)}
        />
      )}
      <header className="flex-shrink-0 bg-black/50 backdrop-blur-md z-10">
          <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
              <div className='flex items-center space-x-2'>
                  <span className="material-symbols-outlined text-3xl text-spotify-green">podcasts</span>
                  <h1 className="text-xl font-bold">Offline Player</h1>
              </div>
              <FileUpload onFilesSelected={handleFilesSelected} isLoading={isUploading} />
          </div>
      </header>
      <main className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <Library 
                tracks={tracks} 
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                onTrackSelect={handleTrackSelect}
                onTrackDelete={handleTrackDelete}
                onTrackEditRequest={handleTrackEditRequest}
            />
        </div>
      </main>
      <footer className="flex-shrink-0 z-20">
        <Player 
            track={currentTrack}
            isPlaying={isPlaying}
            duration={duration}
            currentTime={currentTime}
            volume={volume}
            onPlayPause={handlePlayPause}
            onNext={playNextTrack}
            onPrev={playPrevTrack}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onExpand={() => setIsNowPlayingVisible(true)}
        />
      </footer>
      <audio 
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={playNextTrack}
      />
    </div>
  );
};

export default App;
