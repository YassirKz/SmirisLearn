import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';

export default function StudentVideoPlayer({ video, nextVideoId, onComplete }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError, info } = useToast();

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    const maxTimeReached = useRef(0);
    const controlsTimeout = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleSeeking = () => {
            if (videoElement.currentTime > maxTimeReached.current + 1) {
                videoElement.currentTime = maxTimeReached.current;
                info("Le visionnage est linéaire : vous ne pouvez pas avancer rapidement vers une partie ultérieure.");
            }
        };

        const handleTimeUpdate = () => {
            if (videoElement.currentTime > maxTimeReached.current) {
                maxTimeReached.current = videoElement.currentTime;
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        videoElement.addEventListener('seeking', handleSeeking);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);

        const handleEnded = async () => {
            if (!user) return;
            try {
                const { error: upsertError } = await supabase
                    .from('user_progress')
                    .upsert({
                        user_id: user.id,
                        video_id: video.id,
                        watched: true,
                        completed_at: new Date().toISOString()
                    }, { onConflict: 'user_id, video_id' });

                if (upsertError) throw upsertError;
                if (onComplete) onComplete();
                success('Vidéo validée ! Vous pouvez maintenant passer à la suite.');
            } catch (err) {
                console.error('Erreur progression:', err);
                showError('Impossible d\'enregistrer votre progression');
            }
        };

        videoElement.addEventListener('ended', handleEnded);

        return () => {
            videoElement.removeEventListener('seeking', handleSeeking);
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('ended', handleEnded);
        };
    }, [video.id, user, onComplete, success, showError, info]);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
    };

    const handleFullscreen = () => {
        if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen();
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    return (
        <div 
            ref={containerRef}
            className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group select-none"
            onContextMenu={(e) => e.preventDefault()}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
            />

            {/* Custom Controls Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 flex flex-col justify-end p-6 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between gap-6">
                    {/* Left: Play/Pause */}
                    <button 
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-95"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 text-white" fill="currentColor" /> : <Play className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" />}
                    </button>

                    {/* Middle: Progress Info (Text only, no scrubbing) */}
                    <div className="flex-1 text-white/60 text-xs font-medium uppercase tracking-widest">
                        Visionnage Linéaire Sécurisé
                    </div>

                    {/* Right: Volume & Fullscreen */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={volume} 
                                onChange={handleVolumeChange}
                                className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-indigo-500 h-1 bg-white/20 rounded-lg"
                            />
                        </div>
                        <button onClick={handleFullscreen} className="text-white/70 hover:text-white transition-colors">
                            <Maximize size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Message for Linear Viewing when paused */}
            {!isPlaying && !showControls && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <Play className="w-16 h-16 text-white/20" />
                </div>
            )}
        </div>
    );
}