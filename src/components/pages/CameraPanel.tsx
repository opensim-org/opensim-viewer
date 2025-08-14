import React, { useCallback, useEffect, useState } from 'react'
import {
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Stack,
  InputLabel,
  SelectChangeEvent
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Camera } from 'three'
import { ModelUIState } from '../../state/ModelUIState'
import { observer } from 'mobx-react'
import { CameraDolly } from '../../state/ViewerState'
import DollyEditorDialog from '../Components/DollyEditorDialog'

const attachmentType = ['Fixed Camera', 'Camera Dolly']

type CameraPanelProps = {
  uState: ModelUIState;
}


function CameraPanel(props :CameraPanelProps) {
  const [selectedAttachment, setSelectedAttachment] = useState('Fixed Camera')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedDolly, setSelectedDolly] = useState('')
  const [availableCameras, setAvailableCameras] = useState<Camera[]>(props.uState.viewerState.cameras);
  const [availableDollies, setAvailableDollies] = useState<CameraDolly[]>(props.uState.viewerState.cameraDollies);
  const [dollyEditorOpen, setDollyEditorOpen] = useState(false);
  const [dollyMode, setDollyMode] = useState(false);
  const curState = props.uState;

  useEffect(() => {
    // Effect logic here
    setAvailableCameras(curState.viewerState.cameras);
    setAvailableDollies(curState.viewerState.cameraDollies);
    return () => {
      // Optional cleanup logic
    };
  }, [availableCameras, curState.viewerState.cameraDollies, curState.viewerState.cameras]);

  const handleCameraChangeEvent = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    handleCameraChange(targetName)
  };

  const handleCameraChange = useCallback((cameraName: string) => {
    const targetName = cameraName
    setSelectedCamera(cameraName);

      const idx = curState.viewerState.cameras.findIndex((value: Camera)=>{return (value.name === targetName)})
      if (idx !== -1) {
          curState.viewerState.setCurrentCameraIndex(idx)
      }
  }, [curState]);
  
  const handleDollyChangeEvent = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    handleDollyChange(targetName)
  };

    const handleDollyChange = useCallback((dollyName: string) => {
    const targetName = dollyName
    setSelectedDolly(dollyName);

      const idx = curState.viewerState.cameraDollies.findIndex((value: CameraDolly)=>{return (value.name === targetName)})
      if (idx !== -1) {
          curState.viewerState.setCurrentDollyIndex(idx)
      }
  }, [curState]);

  const handleAdd = () => {
    if (dollyMode) {
      setDollyEditorOpen(true)
    }
    else {
      curState.viewerState.saveCameraAndTarget=true; // Message Control to save camera and target
    }
  }

    const handleEdit = () => {
    if (dollyMode) {
      setDollyEditorOpen(true)
    }
    else {
      //curState.viewerState.saveCameraAndTarget=true; // Message Control to save camera and target
    }
  }

  const handleCameraTypeChange = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string;
    setSelectedAttachment(targetName);
    setDollyMode(selectedAttachment==="Fixed Camera");
  }
  return (
    <>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel shrink id="camera-att-label">Attachment</InputLabel>
        <Select
          value={selectedAttachment}
          labelId="camera-att-label"
          onChange={handleCameraTypeChange}
          displayEmpty
        >
          {/* <MenuItem value="">Default Camera</MenuItem> */}
          {attachmentType.map((obj) => (
            <MenuItem key={obj} value={obj}>
              {obj}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel shrink id="camera-name-label">Camera</InputLabel>
        {dollyMode?
          <Select
          value={selectedDolly}
          label="Dolly:"
          onChange={handleDollyChangeEvent}
          displayEmpty
        >
          <MenuItem value="">None</MenuItem>
          {availableDollies.map((cam) => (
            <MenuItem key={cam.name} value={cam.name}>
              {cam.name}
            </MenuItem>
          ))}
        </Select>
        :
        <Select
          value={selectedCamera}
          label="Camera:"
          onChange={handleCameraChangeEvent}
          displayEmpty
        >
          <MenuItem value="">None</MenuItem>
          {availableCameras.map((cam) => (
            <MenuItem key={cam.name} value={cam.name}>
              {cam.name}
            </MenuItem>
          ))}
        </Select>}
      </FormControl>
      <FormControl margin="dense" size="small" variant="standard" >
      <Stack direction="row">
        <IconButton color="primary" title="Add Camera/Dolly" onClick={handleAdd}>
          <AddIcon />
        </IconButton>
        <IconButton color="info" title="Edit Camera/Dolly" disabled={!selectedCamera} onClick={handleEdit}>
          {/** This should open the tree with selected camera node so location, name props can all be changed in one place. */}
          <EditIcon />
        </IconButton>
        <IconButton color="error" title="Delete Camera/Dolly" disabled={!selectedCamera} onClick={() => {
              curState.viewerState.deleteCurrentCamera()}}>
          <DeleteIcon />
        </IconButton>
      </Stack>
      </FormControl>
      <DollyEditorDialog
          open={dollyEditorOpen}
          onClose={() => setDollyEditorOpen(false)}
          uiState={curState}
      />
    </>
  )
}

export default observer(CameraPanel);