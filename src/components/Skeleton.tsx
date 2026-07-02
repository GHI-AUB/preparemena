export function WorkspaceSkeleton({ label = 'Loading workspace' }: { label?: string }) {
  return <div className="skeleton-workspace" role="status" aria-label={label}>
    <div className="skeleton band" />
    <div className="skeleton-grid">
      <div className="skeleton block" />
      <div className="skeleton block" />
      <div className="skeleton block short" />
      <div className="skeleton block short" />
    </div>
  </div>
}
