import { IconSearch } from '../icons.jsx'
import { NavAddMenu } from './NavAddMenu.jsx'
import { switchView, getSearchPlaceholder } from '../utils/view.js'
import { isLightTheme } from '../themes.js'

const LIBRARY_VIEWS = [
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
  { id: 'recent', label: 'Recently Added' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'playlists', label: 'Playlists' },
]

export function TopBar({
  view,
  setView,
  setSelectedPlaylistId,
  setSelectedAlbumKey,
  setSelectedArtist,
  setSelectedArtistAlbum,
  search,
  setSearch,
  selectedPlaylistId,
  selectedAlbumKey,
  selectedArtist,
  selectedArtistAlbum,
  fileInputRef,
  folderInputRef,
  onAddFiles,
  onDeleteLibrary,
  hasLibraryContent,
  theme,
  onThemeChange,
}) {
  const handleViewChange = (nextView) => {
    switchView({
      setView,
      setSelectedPlaylistId,
      setSelectedAlbumKey,
      setSelectedArtist,
      setSelectedArtistAlbum,
      setSearch,
      nextView,
    })
  }

  const handleFileChange = (e) => {
    onAddFiles(e.target.files)
    e.target.value = ''
  }

  const logoSrc = isLightTheme(theme)
    ? `${import.meta.env.BASE_URL}lizard-logo-light.png`
    : `${import.meta.env.BASE_URL}lizard-logo-dark.png`

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon">
          <img
            className="brand-logo"
            src={logoSrc}
            alt=""
            width={32}
            height={32}
          />
        </span>
        <span className="brand-name">Lizard Music</span>
      </div>
      <nav className="nav" aria-label="Library">
        <div className="nav-views" role="group" aria-label="Library views">
          {LIBRARY_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={view === id ? 'active' : ''}
              onClick={() => handleViewChange(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="nav-tools">
          <span className="nav-divider" aria-hidden="true" />
          <NavAddMenu
            onAddFiles={() => fileInputRef.current?.click()}
            onAddFolder={() => folderInputRef.current?.click()}
            onDeleteLibrary={onDeleteLibrary}
            hasLibraryContent={hasLibraryContent}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        </div>
      </nav>
      <div className="search">
        <IconSearch />
        <input
          type="text"
          placeholder={getSearchPlaceholder(view, {
            selectedPlaylistId,
            selectedAlbumKey,
            selectedArtist,
            selectedArtistAlbum,
          })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        hidden
        onChange={handleFileChange}
      />
    </header>
  )
}
