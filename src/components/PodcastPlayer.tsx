import React, { useState, useRef, useEffect } from 'react';
import './PodcastPlayer.css';

interface PodcastPlayerProps {
    compact?: boolean;
}

/**
 * Minimal podcast/audio player.
 * Users paste a podcast URL or upload an audio file to listen while riding.
 */
export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ compact = false }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [url, setUrl] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showInput, setShowInput] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTime = () => setCurrentTime(audio.currentTime);
        const onDur = () => setDuration(audio.duration || 0);
        const onEnd = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onDur);
        audio.addEventListener('ended', onEnd);
        return () => {
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onDur);
            audio.removeEventListener('ended', onEnd);
        };
    }, [loaded]);

    const loadUrl = () => {
        if (!url.trim()) return;
        setLoaded(true);
        setIsPlaying(false);
        setTimeout(() => {
            audioRef.current?.load();
        }, 50);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        setLoaded(true);
        setTimeout(() => {
            audioRef.current?.load();
        }, 50);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (delta: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + delta);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${String(sec).padStart(2, '0')}`;
    };

    if (compact) {
        return (
            <div className="podcast-compact">
                <audio ref={audioRef} src={url} preload="metadata" />
                {!loaded ? (
                    <button className="podcast-add-btn" onClick={() => setShowInput(!showInput)}>
                        🎧 Audio
                    </button>
                ) : (
                    <div className="podcast-compact-controls">
                        <button onClick={() => skip(-15)} className="podcast-skip-btn">⏪</button>
                        <button onClick={togglePlay} className="podcast-play-btn">
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => skip(15)} className="podcast-skip-btn">⏩</button>
                        <span className="podcast-time">{formatTime(currentTime)}</span>
                    </div>
                )}
                {showInput && !loaded && (
                    <div className="podcast-url-popup">
                        <input
                            type="text"
                            placeholder="Paste podcast MP3 URL…"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadUrl()}
                            className="podcast-url-input"
                        />
                        <label className="podcast-file-label">
                            📁
                            <input type="file" accept="audio/*" onChange={handleFile} hidden />
                        </label>
                        <button onClick={loadUrl} className="podcast-load-btn">Load</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="podcast-player">
            <audio ref={audioRef} src={url} preload="metadata" />
            <div className="podcast-header">
                <span className="podcast-icon">🎧</span>
                <span className="podcast-title">Audio Player</span>
            </div>
            {!loaded ? (
                <div className="podcast-load-section">
                    <input
                        type="text"
                        placeholder="Paste podcast MP3 URL…"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadUrl()}
                        className="podcast-url-input"
                    />
                    <div className="podcast-load-actions">
                        <button onClick={loadUrl} className="podcast-load-btn">Load URL</button>
                        <label className="podcast-file-btn">
                            📁 Browse File
                            <input type="file" accept="audio/*" onChange={handleFile} hidden />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="podcast-controls">
                    <div className="podcast-progress-bar">
                        <div
                            className="podcast-progress-fill"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                    </div>
                    <div className="podcast-time-row">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="podcast-buttons">
                        <button onClick={() => skip(-15)} className="podcast-skip-btn">-15s</button>
                        <button onClick={togglePlay} className="podcast-play-btn-large">
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => skip(15)} className="podcast-skip-btn">+15s</button>
                    </div>
                </div>
            )}
        </div>
    );
};
