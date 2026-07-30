import IconButton from '@mui/material/IconButton';
import SettingsIcon from "@mui/icons-material/Settings";

import DollyIcon from './DollyIcon';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react-lite';
import Tooltip from '@mui/material/Tooltip';

export default observer(function DollyCombo() {
  const options = ['Dollies..'];
  const [anchorEl, ] = useState<HTMLElement | null>(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const [lastSceneVersion, setLastSceneVersion] = useState(viewerState.sceneVersion);

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
  const handleSelect = () => {
      curState.setIsInDollyEditMode(true);
      curState.setIsInRecordMode(false)
      curState.viewerState.setShowAspectRatioGuides?.(false);
  };

  return (
    <>
    <Tooltip title={
      (viewerState.currentDollyIndex !== -1) ?
        viewerState.cameraDollies[viewerState.currentDollyIndex].name :
        'no Dolly'
      } placement="right">
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