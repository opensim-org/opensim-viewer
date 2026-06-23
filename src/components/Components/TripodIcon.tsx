import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

function TripodIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* opacity layer */}
      <g opacity="0.3">
        <polygon points="9,9.5 10.2,9.5 3.8,22 2.6,22" fill="#1976D2"/>
        <rect x="11.5" y="9.5" width="1" height="12.5" fill="#1976D2"/>
        <polygon points="13.8,9.5 15,9.5 21.4,22 20.2,22" fill="#1976D2"/>
        <rect x="9.2" y="6.2" width="5.6" height="3" rx="0.3" fill="#263238"/>
        <rect x="11.2" y="3.8" width="1.6" height="2.4" fill="#263238"/>
        <rect x="7.8" y="1.5" width="8.4" height="2.3" rx="0.4" fill="#263238"/>
        <rect x="14.8" y="7" width="6.5" height="1.2" rx="0.6" fill="#263238"/>
      </g>
      {/* solid layer */}
      <polygon points="9,9.5 10.2,9.5 3.8,22 2.6,22" fill="#1565C0"/>
      <rect x="11.5" y="9.5" width="1" height="12.5" rx="0.5" fill="#1565C0"/>
      <polygon points="13.8,9.5 15,9.5 21.4,22 20.2,22" fill="#1565C0"/>
      <rect x="9.2" y="6.2" width="5.6" height="3" rx="0.3" fill="#263238"/>
      <rect x="11.2" y="3.8" width="1.6" height="2.4" fill="#263238"/>
      <rect x="7.8" y="1.5" width="8.4" height="2.3" rx="0.4" fill="#263238"/>
      <rect x="14.8" y="7" width="6.5" height="1.2" rx="0.6" fill="#263238"/>
    </SvgIcon>
  );
}

export default TripodIcon;