import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

function DollyIcon(props: SvgIconProps) {
  return (
<SvgIcon {...props} viewBox="0 0 24 24">
  {/* Secondary: camera body fill */}
  <path
    opacity="0.3"
    d="M7 4.5C7 3.67 7.67 3 8.5 3h7c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-7C7.67 10 7 9.33 7 8.5v-4Z"
    fill="currentColor"
  />
  {/* Primary: camera outline + lens + dolly platform + wheels */}
  <path
    d="M15.5 2h-7C7.12 2 6 3.12 6 4.5v4C6 9.88 7.12 11 8.5 11H11v1.5H8.5a.5.5 0 000 1H11V14H7a1 1 0 000 2h10a1 1 0 000-2h-4v-1.5h2.5a.5.5 0 000-1H13V11h2.5c1.38 0 2.5-1.12 2.5-2.5v-4C18 3.12 16.88 2 15.5 2Zm1 6.5c0 .55-.45 1-1 1h-7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v4ZM12 8.5a2 2 0 100-4 2 2 0 000 4Z"
    fill="currentColor"
  />
  {/* Dolly platform */}
  <rect x="6" y="16.5" width="12" height="1.5" rx="0.5" fill="currentColor" />
  {/* Left wheel */}
  <circle cx="8.5" cy="20.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
  <circle cx="8.5" cy="20.5" r="0.4" fill="currentColor" />
  {/* Right wheel */}
  <circle cx="15.5" cy="20.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
  <circle cx="15.5" cy="20.5" r="0.4" fill="currentColor" />
</SvgIcon>
  );
}

export default DollyIcon;