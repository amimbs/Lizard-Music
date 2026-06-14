import {
  IconPlay,
  IconPause,
  IconNext,
  IconPrev,
  IconShuffle,
  IconRepeat,
  IconRepeatOne,
  IconVolume,
  IconVolumeMute,
  IconHeart,
  IconHeartFilled,
  IconMusic,
} from '../icons.jsx'
import { formatTime } from '../utils/format.js'

export function PlayerFooter({
  currentTrack,
  loading,
  isPlaying,
  progress,
  duration,
  volume,
  muted,
  shuffle,
  repeat,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
}) {
  return (
    <footer className="player">
      <div className="np">
        {currentTrack ? (
          <>
            <div className="np-cover">
              {currentTrack.cover ? (
                <img src={currentTrack.cover} alt="" />
              ) : (
                <div className="np-cover-fallback"><IconMusic /></div>
              )}
            </div>
            <div className="np-meta">
              <div className="np-title" title={currentTrack.title}>{currentTrack.title}</div>
              <div className="np-artist" title={currentTrack.artist}>{currentTrack.artist}</div>
            </div>
            <button
              type="button"
              className={`np-favorite ${currentTrack.favorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(currentTrack.id)}
              aria-label={currentTrack.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {currentTrack.favorite ? <IconHeartFilled /> : <IconHeart />}
            </button>
          </>
        ) : (
          <div className="np-meta">
            <div className="np-title">{loading ? 'Loading…' : 'Nothing playing'}</div>
            <div className="np-artist">Add some music to get started</div>
          </div>
        )}
      </div>

      <div className="controls">
        <div className="control-buttons">
          <button
            className={`ctrl ${shuffle ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title="Shuffle"
            aria-label="Shuffle"
          >
            <IconShuffle />
          </button>
          <button className="ctrl" onClick={onPrev} title="Previous (Shift+Left)" aria-label="Previous">
            <IconPrev />
          </button>
          <button className="ctrl play" onClick={onTogglePlay} title="Play/Pause (Space)" aria-label="Play or pause">
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="ctrl" onClick={() => onNext()} title="Next (Shift+Right)" aria-label="Next">
            <IconNext />
          </button>
          <button
            className={`ctrl ${repeat !== 'off' ? 'active' : ''}`}
            onClick={onCycleRepeat}
            title={`Repeat: ${repeat}`}
            aria-label={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <IconRepeatOne /> : <IconRepeat />}
          </button>
        </div>
        <div className="seek">
          <span className="time">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={progress}
            onChange={onSeek}
            aria-label="Seek"
            style={{ '--pct': `${duration ? (progress / duration) * 100 : 0}%` }}
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume">
        <button className="ctrl" onClick={onToggleMute} title="Mute" aria-label="Mute">
          {muted || volume === 0 ? <IconVolumeMute /> : <IconVolume />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step="0.01"
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          style={{ '--pct': `${(muted ? 0 : volume) * 100}%` }}
        />
      </div>
    </footer>
  )
}
