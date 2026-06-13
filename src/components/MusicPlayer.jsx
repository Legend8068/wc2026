import React, { useState, useRef, useEffect } from 'react';

import PLAYLIST from '../tracks.json';

export default function MusicPlayer() {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const startedRef = useRef(false);
  const track = PLAYLIST[currentTrackIdx];

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    startedRef.current = true;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // If the file doesn't exist, this will throw an error, which we catch silently
      audioRef.current.play().catch(e => console.log("Please add actual mp3 files to public/audio/", e));
    }
    setIsPlaying(!isPlaying);
  };

  // Skip tracks
  const handleNext = () => {
    startedRef.current = true;
    setCurrentTrackIdx((prev) => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    startedRef.current = true;
    setCurrentTrackIdx((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  // Autoplay attempt on mount & interaction listener to bypass browser block
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const startAudio = () => {
      if (startedRef.current) return;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          startedRef.current = true;
          cleanup();
        })
        .catch(err => {
          console.log("Autoplay blocked. Audio will play on first user interaction.", err);
        });
    };

    const handleUserInteraction = () => {
      startAudio();
    };

    const cleanup = () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('start-world-cup-music', handleUserInteraction);
    };

    // Try playing immediately
    startAudio();

    // Listen to user interaction if autoplay was blocked
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('start-world-cup-music', handleUserInteraction);

    return () => {
      cleanup();
    };
  }, []);

  // Auto-play when track changes if it was already playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Missing audio file:", e));
    }
  }, [currentTrackIdx, isPlaying]);

  // Update progress bar
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleEnded = () => {
    handleNext();
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
    setProgress(percent * 100);
  };

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={track.audio}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      {/* Spinning Football "Record" */}
      <div className={`mp-record ${isPlaying ? 'spinning' : ''}`}>
        <svg viewBox="0 0 100 100" className="football-record">
          <circle cx="50" cy="50" r="48" fill="var(--white)" stroke="var(--gold)" strokeWidth="2" />
          <path d="M50 5 L65 30 L95 35 L75 55 L80 85 L50 70 L20 85 L25 55 L5 35 L35 30 Z" fill="var(--dark)" opacity="0.1" />
          <path d="M50 20 L60 40 L80 45 L65 60 L70 80 L50 70 L30 80 L35 60 L20 45 L40 40 Z" fill="none" stroke="var(--red)" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="var(--dark)" />
          <circle cx="50" cy="50" r="3" fill="var(--gold)" />
        </svg>
      </div>

      <div className="mp-info">
        <div className="mp-title">{track.title}</div>
        <div className="mp-artist">{track.artist} <span className="mp-year">({track.year})</span></div>
        
        <div className="mp-progress-container" onClick={handleProgressClick}>
          <div className="mp-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mp-controls">
        <button onClick={handlePrev} className="mp-btn" aria-label="Previous Track">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>
        
        <button onClick={togglePlay} className="mp-btn mp-play" aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        
        <button onClick={handleNext} className="mp-btn" aria-label="Next Track">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
