import { IconMusic, IconFile, IconFolder } from '../icons.jsx'

export function EmptyState({ onPickFiles, onPickFolder }) {
  return (
    <div className="empty">
      <div className="empty-icon"><IconMusic /></div>
      <h1>Your library is empty</h1>
      <p>Pick individual songs or a whole folder of music from your device to start listening.</p>
      <div className="empty-actions">
        <button className="btn primary" onClick={onPickFiles}><IconFile /> Add files</button>
        <button className="btn" onClick={onPickFolder}><IconFolder /> Add folder</button>
      </div>
      <p className="hint">Everything stays on your device — nothing is uploaded. Your library is saved locally between sessions.</p>
    </div>
  )
}
