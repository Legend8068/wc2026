import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';

import PLAYLIST from '../tracks.json';
import spinnerAnimation from '../assets/music-spinner.json';

const LottieComponent = Lottie.default || Lottie;

export default function MusicPlayer() {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef(null);
  const lottieRef = useRef(null);
  const tracksRef = useRef(null);
  const prevShowPlaylist = useRef(showPlaylist);

  const startedRef = useRef(false);
  const track = PLAYLIST[currentTrackIdx];

  // Format time (e.g. "1:23")
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    startedRef.current = true;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
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

  // Mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
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

    startAudio();

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

  // Sync Lottie playback with audio state
  useEffect(() => {
    if (lottieRef.current) {
      if (isPlaying) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-scroll playlist
  useEffect(() => {
    let timer;
    if (showPlaylist && tracksRef.current) {
      const container = tracksRef.current;
      const isJustOpening = !prevShowPlaylist.current;

      const doScroll = (behavior, heightOverride) => {
        const activeEl = container.querySelector('.mp-track-item.active');
        if (activeEl) {
          const cHeight = heightOverride || container.clientHeight;
          if (cHeight > 0) {
            container.scrollTo({
              top: activeEl.offsetTop - (cHeight / 2) + (activeEl.offsetHeight / 2),
              behavior
            });
          }
        }
      };

      if (isJustOpening) {
        // Pre-scroll instantly before/during the animation using the expected final height
        doScroll('auto', Math.min(280, container.scrollHeight));
        
        // Follow up after the 400ms CSS transition finishes to ensure perfect centering
        timer = setTimeout(() => {
          doScroll('smooth');
        }, 450);
      } else {
        // Track changed while playlist is already fully open
        doScroll('smooth');
      }
    }
    prevShowPlaylist.current = showPlaylist;
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showPlaylist, currentTrackIdx]);

  // Update progress bar
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      if (duration) {
        setDuration(duration);
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
    <>
      <div className={`music-player ${isPlaying ? 'is-playing' : ''}`}>
        <audio
          ref={audioRef}
          src={track.audio}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
        />

        {/* Playlist Expanding Wrapper */}
        <div className={`mp-playlist-wrapper ${showPlaylist ? 'open' : ''}`}>
          <div className="mp-playlist-inner">
            <div className="mp-playlist-header">
              <h4>World Cup Playlist</h4>
              <button className="mp-close-btn" onClick={() => setShowPlaylist(false)}>✕</button>
            </div>
            <div className="mp-playlist-tracks" ref={tracksRef}>
              {PLAYLIST.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`mp-track-item ${idx === currentTrackIdx ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTrackIdx(idx);
                    setIsPlaying(true);
                    if (!startedRef.current) startedRef.current = true;
                  }}
                >
                  <div className="mp-track-num">{idx + 1}</div>
                  <div className="mp-track-details">
                    <div className="mp-track-title">{t.title}</div>
                    <div className="mp-track-artist">{t.artist}</div>
                  </div>
                  {idx === currentTrackIdx && (
                    <div className={`mp-visualizer mini ${isPlaying ? 'playing' : ''}`}>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Controls Bar */}
        <div className="mp-bottom-bar">
          <div className="mp-record">
            <LottieComponent
              lottieRef={lottieRef}
              animationData={spinnerAnimation}
              loop={true}
              autoplay={false}
              className="football-record"
            />
          </div>

          <div className="mp-right-col">
            <div className="mp-header">
              <div className="mp-title-row">
                <div className="mp-title">{track.title}</div>
                <div className={`mp-visualizer ${isPlaying ? 'playing' : ''}`}>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>
              </div>
              <div className="mp-artist">{track.artist} <span className="mp-year">({track.year})</span></div>
            </div>
            
            <div className="mp-lower-row">
              <div className="mp-scrub-row">
                <span className="mp-time">{formatTime(currentTime)}</span>
                <div className="mp-progress-container" onClick={handleProgressClick}>
                  <div className="mp-progress-bg"></div>
                  <div className="mp-progress-bar" style={{ width: `${progress}%` }}>
                    <div className="mp-progress-thumb"></div>
                  </div>
                </div>
                <span className="mp-time">{formatTime(duration)}</span>
              </div>

              <div className="mp-controls">
                <button onClick={() => setShowPlaylist(!showPlaylist)} className={`mp-btn mp-playlist-btn ${showPlaylist ? 'active' : ''}`} aria-label="Playlist">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                
                <button onClick={handlePrev} className="mp-btn" aria-label="Previous Track">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                  </svg>
                </button>
                
                <button onClick={togglePlay} className="mp-btn mp-play" aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
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
                
                <button onClick={toggleMute} className="mp-btn mp-mute-btn" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
