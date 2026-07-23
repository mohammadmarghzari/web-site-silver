/**
 * INTRO PACK — SINGLE SOURCE OF TRUTH
 * Change text, colors, timing, or icon files here — everything else
 * (CSS custom properties + all 3 scene components) reads from this object.
 * No other file should hardcode a color, string, or duration.
 */
window.INTRO_CONFIG = {
  brand: {
    name: "UNNAMED-GT",
    badgeSrc: "assets/logo/unnamed-gt-badge.svg",
    // Not used in the 8s intro itself, kept here for outro/end-card reuse.
    creatorSrc: "assets/logo/creator-silhouette.svg",
  },

  colors: {
    bg: "#05060a",
    bgSoft: "#0b0d12",
    white: "#f5f6f8",
    red: "#ff1e32",
    redStrong: "#ff0033",
    redSoft: "#ff5468",
  },

  // Total intro length in seconds. Every scene offset below is relative to this.
  totalDuration: 8,

  scenes: {
    like: {
      icon: "assets/icons/like.svg",
      title: "LIKE",
      subtitle: "Support the channel.",
      start: 0.0,
      end: 2.5,
      enterFrom: "left",
    },
    comment: {
      icon: "assets/icons/comment.svg",
      title: "COMMENT",
      subtitle: "Share your strategy.",
      start: 2.5,
      end: 5.0,
      enterFrom: "right",
    },
    subscribe: {
      iconBell: "assets/icons/bell.svg",
      iconPlus: "assets/icons/subscribe-plus.svg",
      iconCheck: "assets/icons/subscribe-check.svg",
      title: "SUBSCRIBE",
      subtitle: "Join 500K+ Generals.",
      buttonLabelBefore: "Subscribe",
      buttonLabelAfter: "Subscribed",
      start: 5.0,
      end: 8.0,
    },
  },

  // Default canvas. Toggle at runtime via IntroPack.setAspect("16:9").
  aspect: "9:16",
};
