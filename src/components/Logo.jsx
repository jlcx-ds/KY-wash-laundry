export default function Logo({ size = 40 }) {
  return (
    <div className="logo-row">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill="#0E7C7B" />
        <circle cx="32" cy="35" r="19" fill="#F7FAF8" />
        <circle cx="32" cy="35" r="14" fill="none" stroke="#0E7C7B" strokeWidth="2.6" />
        <path d="M20 35a12 12 0 0 1 12 -12" fill="none" stroke="#FFC857" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="21" cy="13" r="2.6" fill="#F7FAF8" />
        <circle cx="30" cy="11" r="2.6" fill="#F7FAF8" />
        <circle cx="39" cy="13" r="2.6" fill="#F7FAF8" />
      </svg>
      <div className="logo-word">KY <span>WASH</span></div>
    </div>
  )
}
