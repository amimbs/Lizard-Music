import { IconBack } from '../icons.jsx'

export function BrowseGrid({
  title,
  countLabel,
  items,
  hasSearch,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  showBack,
  onBack,
  backLabel,
  hideHeader = false,
}) {
  return (
    <div className="browse-browser">
      {!hideHeader && (
        <div className="page-title">
          {showBack && (
            <button
              type="button"
              className="page-back"
              onClick={onBack}
              aria-label={backLabel}
            >
              <IconBack />
            </button>
          )}
          <h1>{title}</h1>
          {countLabel ? <span className="page-count">{countLabel}</span> : null}
        </div>
      )}

      {items.length === 0 ? (
        <div className="view-empty browse-empty">
          <div className="view-empty-icon">{emptyIcon}</div>
          <h2>{hasSearch ? `No ${title.toLowerCase()} match your search` : emptyTitle}</h2>
          <p>{hasSearch ? 'Try a different search term.' : emptyMessage}</p>
        </div>
      ) : (
        <ul className="browse-cards">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="browse-card" onClick={item.onOpen}>
                <span className="browse-card-cover">
                  {item.cover ? (
                    <img src={item.cover} alt="" loading="lazy" />
                  ) : (
                    <span className="browse-card-fallback">{item.icon}</span>
                  )}
                </span>
                <span className="browse-card-meta">
                  <span className="browse-card-title">{item.title}</span>
                  {item.subtitle ? (
                    <span className="browse-card-subtitle">{item.subtitle}</span>
                  ) : null}
                  {item.count ? (
                    <span className="browse-card-count">{item.count}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
