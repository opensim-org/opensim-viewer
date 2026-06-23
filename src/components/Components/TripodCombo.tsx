import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PhotoCameraTwoTone from '@mui/icons-material/PhotoCameraTwoTone';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';

let options = ['Add...'];

export default function TripodCombo() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const [selected, setSelected] = useState(options[0]);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (value: string) => {
    setSelected(value);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ borderRadius: '8px', gap: 0.5 }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <PhotoCameraTwoTone />
        <Typography variant="caption" sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected}
        </Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: '0.875rem', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map(opt => (
          <MenuItem
            key={opt}
            selected={opt === selected}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}