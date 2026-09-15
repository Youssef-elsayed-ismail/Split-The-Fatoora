import styles from './home.module.css'

/**
 * A receipt held inside a camera viewfinder. Inline SVG so it stays crisp, needs no
 * asset, and picks up the theme tokens from the stylesheet.
 */
export function ReceiptVisual() {
  return (
    <svg
      className={styles.visual}
      viewBox="0 0 120 116"
      role="img"
      aria-label="A receipt framed by a camera viewfinder"
    >
      {/* Viewfinder corners */}
      <g className={styles.viewfinder}>
        <path d="M14 32V22a8 8 0 0 1 8-8h10" />
        <path d="M106 32V22a8 8 0 0 0-8-8H88" />
        <path d="M14 84v10a8 8 0 0 0 8 8h10" />
        <path d="M106 84v10a8 8 0 0 1-8 8H88" />
      </g>

      {/* Receipt, torn along the bottom edge */}
      <path
        className={styles.paper}
        d="M34 24a4 4 0 0 1 4-4h44a4 4 0 0 1 4 4v72l-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5Z"
      />

      <rect className={styles.headline} x="42" y="34" width="26" height="5" rx="2.5" />
      <g className={styles.line}>
        <rect x="42" y="47" width="36" height="3.5" rx="1.75" />
        <rect x="42" y="55" width="28" height="3.5" rx="1.75" />
        <rect x="42" y="63" width="33" height="3.5" rx="1.75" />
      </g>

      <path className={styles.rule} d="M42 73.5h36" />
      <rect className={styles.headline} x="42" y="79" width="16" height="4.5" rx="2.25" />
      <rect className={styles.total} x="64" y="79" width="14" height="4.5" rx="2.25" />
    </svg>
  )
}
