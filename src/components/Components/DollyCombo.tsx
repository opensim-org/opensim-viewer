import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DollyIcon from './DollyIcon';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react-lite';
import DollyEditorDialog from './DollyEditorDialog';

export default observer(function DollyCombo() {
  const options = ['Add...'];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const [selected, setSelected] = useState(options[0]);
  const [lastSceneVersion, setLastSceneVersion] = useState(viewerState.sceneVersion);
  const [dollyEditorOpen, setDollyEditorOpen] = useState(false);

  React.useEffect(() => {
    if (viewerState.sceneVersion !== lastSceneVersion) {
      setLastSceneVersion(viewerState.sceneVersion);

    }
  }, [viewerState.sceneVersion, lastSceneVersion]);

  const open = Boolean(anchorEl);

  viewerState.cameraDollies.forEach((dolly) => {
    if (!options.includes(dolly.name)) {
      options.push(dolly.name);
    }
  });
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (value: string) => {
    if (value === 'Add...') {
      setDollyEditorOpen(true);
    } else {
      const idx = viewerState.cameraDollies.findIndex((dolly) => dolly.name === value);
      curState.viewerState.setCurrentDollyIndex(idx);
      setSelected(value);
    }
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ borderRadius: '8px', gap: 0.5 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        color="primary"
      >
        <DollyIcon />
        <Typography variant="caption" sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {curState.viewerState.currentDollyIndex!==-1?selected:options[0]}
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
      <DollyEditorDialog
          open={dollyEditorOpen}
          edit={false}
          onClose={function() {setDollyEditorOpen(false)}}
          uiState={curState}
      />
    </>
  );
});