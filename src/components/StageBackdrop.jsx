export default function StageBackdrop({ backgroundKey = "golden_party", backgroundUrl = null }) {
  if (backgroundUrl) {
    return (
      <div
        className="stage-backdrop stage-backdrop--custom"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(29, 6, 42, 0.48), rgba(10, 1, 16, 0.76)), url(${JSON.stringify(backgroundUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`stage-backdrop stage-backdrop--${backgroundKey}`}
      aria-hidden
    >
      <div className="stage-spotlight" />
      <div className="stage-bokeh">
        <span className="stage-bokeh-orb stage-bokeh-orb--1" />
        <span className="stage-bokeh-orb stage-bokeh-orb--2" />
        <span className="stage-bokeh-orb stage-bokeh-orb--3" />
        <span className="stage-bokeh-orb stage-bokeh-orb--4" />
      </div>
      <div className="stage-curtains" />
      <div className="stage-curtains stage-curtains--right" />
      <div className="stage-beads">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="stage-sparkles" />
      <div className="stage-floor-glow" />
      <div className="stage-champagne">
        <span className="stage-champagne-bottle" />
        <span className="stage-champagne-stream" />
        <span className="stage-champagne-glass stage-champagne-glass--1" />
        <span className="stage-champagne-glass stage-champagne-glass--2" />
        <span className="stage-champagne-glass stage-champagne-glass--3" />
      </div>
      <div className="stage-rays" />
    </div>
  );
}
