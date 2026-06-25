import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TripodIcon from './TripodIcon';
import React, { useState } from 'react';
import { useModelContext } from '../../state/ModelUIStateContext';
import { observer } from 'mobx-react-lite';


export default observer(function TripodCombo() {
  const options = ['Add...'];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const curState = useModelContext();
  const viewerState = curState.viewerState;
  const [selected, setSelected] = useState(options[0]);
  const [lastSceneVersion, setLastSceneVersion] = useState(viewerState.sceneVersion);

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
      setSelected(viewerState.currentCameraIndex !== -1 ? viewerState.cameras[viewerState.currentCameraIndex].name : 'Add...');
        //viewerState.setCamerasNeedUpdate(false);
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
  const handleSelect = (value: string) => {
    if (value === 'Add...') {
      const newTripodName = prompt('Enter a name for the new tripod:'); 
      if (newTripodName) {
        viewerState.saveCameraAndTarget = true;
        viewerState.saveCameraName = newTripodName;
        options.push(newTripodName);
        setSelected(newTripodName);
      }
    } else {
      const idx = viewerState.cameras.findIndex((cam) => cam.name === value);
      curState.viewerState.setCurrentCameraIndex(idx);
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
        <TripodIcon />
        <Typography variant="caption" sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {curState.viewerState.currentCameraIndex!==-1?selected:options[0]}
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
});