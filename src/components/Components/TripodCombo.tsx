import IconButton from '@mui/material/IconButton';
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TripodIcon from './TripodIcon';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react-lite';
import { usePrompt } from './Dialogs/PromptDialog';
import Tooltip from '@mui/material/Tooltip';


export default observer(function TripodCombo() {
  const options = ['New...'];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const [selected, setSelected] = useState(options[0]);
  const [lastSceneVersion, setLastSceneVersion] = useState(viewerState.sceneVersion);
  const { prompt, PromptDialog } = usePrompt();

  React.useEffect(() => {
    if (viewerState.sceneVersion !== lastSceneVersion) {
      setLastSceneVersion(viewerState.sceneVersion);
      // Update options or perform any other necessary actions when the scene version changes
      // refresh the names if the cameras have changed
      if (viewerState.camerasNeedUpdate) {
        options.length = 1;
          viewerState.cameras.forEach((camera) => {
      if (!options.includes(camera.name)) {
        options.push(camera.name);
        }
      });
      setSelected(viewerState.currentCameraIndex !== -1 ? viewerState.cameras[viewerState.currentCameraIndex].name : 'New...');
      }
    }
  }, [viewerState.sceneVersion, lastSceneVersion, viewerState.camerasNeedUpdate, viewerState.currentCameraIndex, viewerState.cameras]);

  const open = Boolean(anchorEl);

  viewerState.cameras.forEach((camera) => {
    if (!options.includes(camera.name)) {
      options.push(camera.name);
    }
  });
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleName = async () => {
    const name = await prompt({ title: 'New Tripod', label: 'Name', defaultValue: 'Tripod 1' });
    if (name !== null) {
        const uniqueTripodName = viewerState.getUniqueCameraName(name);
        viewerState.saveCameraAndTarget = true;
        viewerState.saveCameraName = uniqueTripodName;
        setSelected(uniqueTripodName);
      // user confirmed
      return uniqueTripodName;
    }
  };
  const handleSelect = (value: string) => {
    if (value === 'New...') {
      handleName();
    } else {
      const idx = viewerState.cameras.findIndex((cam) => cam.name === value);
      curState.viewerState.setCurrentCameraIndex(idx);
      setSelected(value);
    }
    handleClose();
  };

  return (
    <>
    <Tooltip title="Tripods..." placement="right">
      <IconButton
        onClick={handleOpen}
        sx={{ borderRadius: '8px', gap: 0.5 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        color="primary"
      >
        <TripodIcon />
      </IconButton>
    </Tooltip>
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
      {PromptDialog}
    </>
  );
});