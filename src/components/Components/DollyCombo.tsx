import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from "@mui/icons-material/Settings";

import DollyIcon from './DollyIcon';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react-lite';
import DollyEditorDialog from './DollyEditorDialog';
import Tooltip from '@mui/material/Tooltip';

export default observer(function DollyCombo() {
  const options = ['Dollies..'];
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
  const handleSelect = () => {
      curState.setIsInDollyEditMode(true);
  };

  return (
    <>
    <Tooltip title="Dollies..." placement="right">
      <IconButton
        onClick={handleSelect}
        sx={{ borderRadius: '8px', gap: 0.5 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        color="primary"
      >
        <DollyIcon />
        <SettingsIcon />
      </IconButton>
      </Tooltip>
    </>
  );
});