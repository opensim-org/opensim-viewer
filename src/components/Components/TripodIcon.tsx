import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

function TripodIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Secondary color: camera body fill */}
      <path
        opacity="0.3"
        d="M7 4.5C7 3.67 7.67 3 8.5 3h7c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-7C7.67 10 7 9.33 7 8.5v-4Z"
        fill="currentColor"
      />
      {/* Primary color: camera outline + lens + tripod legs */}
      <path
        d="M15.5 2h-7C7.12 2 6 3.12 6 4.5v4C6 9.88 7.12 11 8.5 11H11v2H8.5a.5.5 0 000 1H11v1.18l-3.38 5.06a.75.75 0 001.25.83L12 17.3l3.13 3.77a.75.75 0 001.25-.83L13 15.18V14h2.5a.5.5 0 000-1H13v-2h2.5c1.38 0 2.5-1.12 2.5-2.5v-4C18 3.12 16.88 2 15.5 2Zm1 6.5c0 .55-.45 1-1 1h-7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v4ZM12 8.5a2 2 0 100-4 2 2 0 000 4Z"
        fill="currentColor"
      />
    </SvgIcon>  );
}

export default TripodIcon;