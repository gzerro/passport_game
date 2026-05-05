export const BootLoader = ({ progress }: { progress: number }) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="boot-loader-shell ritual-shell">
      <div className="boot-loader-shell__backdrop" aria-hidden="true" />
      <div className="boot-loader-shell__dust" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={`boot-dust-${index + 1}`}
            className={`boot-loader-shell__dust-particle boot-loader-shell__dust-particle--${index + 1}`}
          />
        ))}
      </div>
      <div className="boot-loader-shell__flare" aria-hidden="true">
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--1" />
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--2" />
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--3" />
      </div>

      <div className="boot-loader-card">
        <h1 className="boot-loader-card__title">Passport Control</h1>

        <div className="boot-loader-card__loader" aria-hidden="true">
          <div className="boot-loader-card__track">
            <span className="boot-loader-card__track-fill" style={{ width: `${normalizedProgress}%` }} />
            <span className="boot-loader-card__track-glow" />
          </div>
          <span className="boot-loader-card__pulse" />
        </div>
      </div>
    </div>
  );
};
