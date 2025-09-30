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
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import FileOpenTwoToneIcon from '@mui/icons-material/FileOpenTwoTone';

import { Camera } from 'three'
import { ModelUIState } from '../../state/ModelUIState'
import { observer } from 'mobx-react'
import { CameraDolly } from '../../state/ViewerState'
import { saveAs } from 'file-saver';

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
  const [editMode, setEditMode] = useState(false);
  const curState = props.uState;

  const handleCameraChange = useCallback((cameraName: string) => {
    const targetName = cameraName
    setSelectedCamera(cameraName);
    const idx = curState.viewerState.cameras.findIndex((value: Camera)=>{return (value.name === targetName)})
    curState.viewerState.setCurrentCameraIndex(idx)

  }, [curState]);
  
  const handleDollyChange = useCallback((dollyName: string) => {
    const targetName = dollyName
    setSelectedDolly(dollyName);

      const idx = curState.viewerState.cameraDollies.findIndex((value: CameraDolly)=>{return (value.name === targetName)})
      if (idx !== -1) {
          curState.viewerState.setCurrentDollyIndex(idx)
      }
  }, [curState]);

  useEffect(() => {
    // Effect logic here
    setAvailableCameras(curState.viewerState.cameras);
    setAvailableDollies(curState.viewerState.cameraDollies);
    if (dollyMode){
      if (curState.viewerState.cameraDollies.length > 0 && curState.viewerState.currentDollyIndex !== -1) {
        const currentDolly = curState.viewerState.cameraDollies[curState.viewerState.currentDollyIndex];
        setSelectedDolly(currentDolly.name);
        handleDollyChange(currentDolly.name);
      }
      else if (curState.viewerState.currentDollyIndex === -1){
        setSelectedDolly("")
      }
    }
    else {
      if (curState.viewerState.cameras.length > 0 && curState.viewerState.currentCameraIndex !== -1) {
        setSelectedCamera(curState.viewerState.cameras[curState.viewerState.currentCameraIndex].name);
        handleCameraChange(curState.viewerState.cameras[curState.viewerState.currentCameraIndex].name);
      }
      else if (curState.viewerState.currentCameraIndex === -1){
        setSelectedCamera("")
      }
    }
    return () => {
      // Optional cleanup logic
    };
  }, [availableCameras, curState.viewerState.cameraDollies, curState.viewerState.currentDollyIndex, curState.viewerState.cameras, 
      curState.viewerState.cameras.length, curState.viewerState.currentCameraIndex, 
      curState.viewerState.animationsNeedUpdate, handleCameraChange, dollyMode, handleDollyChange]);

  const handleCameraChangeEvent = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    handleCameraChange(targetName)
  };
  
  const handleDollyChangeEvent = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string
    handleDollyChange(targetName)
  };

  const handleAdd = function() {
    if (dollyMode) {
      setEditMode(false)
      setDollyEditorOpen(true)
    }
    else {
      curState.viewerState.saveCameraAndTarget=true; // Message Control to save camera and target
    }
  }

    const handleEdit = function() {
    if (dollyMode) {
      setEditMode(true);
      setDollyEditorOpen(true)
    }
    else {
      //curState.viewerState.saveCameraAndTarget=true; // Message Control to save camera and target
    }
  }

  const handleDelete = function() {
    if (dollyMode) {
      curState.viewerState.deleteCurrentDolly();
    }
    else {
      curState.viewerState.deleteCurrentCamera(); // Message Control to save camera and target
    }
  }

  const handleCameraTypeChange = (event: SelectChangeEvent) => {
    const targetName = event.target.value as string;
    setSelectedAttachment(targetName);
    setDollyMode(selectedAttachment==="Fixed Camera");
  }

  const handleSaveCamerasOrDollies = function() {
    if (dollyMode) {
      const json = curState.viewerState.saveDolliesToJson();
      // query for file name and save
      const defaultName = "dollies.json";
      //const fileName = window.prompt("Enter file name:", defaultName) || defaultName;
      saveAs(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), defaultName);
    }
    else {
      const json = curState.viewerState.saveCamerasToJson();
      // query for file name and save
      const defaultName = "cameras.json";
      //const fileName = window.prompt("Enter file name:", defaultName) || defaultName;
      saveAs(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), defaultName);
    }
  }

  const handleLoadCamerasOrDollies = function() {
    if (dollyMode) {
      // Create a file input element to select the JSON file
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.oninput = function(event) {
        var fileInput = event.target as HTMLInputElement;
        var file = fileInput && fileInput.files && fileInput.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var json = e && e.target && e.target.result;
            //console.log("Loaded dollies json: ", json);
            if (json) {
              curState.viewerState.loadDolliesFromJson(JSON.parse(json as string));
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
    else {
      // Create a file input element to select the JSON file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.oninput = (event) => {
        const fileInput = event.target as HTMLInputElement;
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const json = e && e.target && e.target.result;
            //console.log("Loaded cameras json: ", json);
            if (json) {
              curState.viewerState.loadCamerasFromJson(JSON.parse(json as string));
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
    };

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
        <IconButton color="info" title="Edit Camera/Dolly" 
        disabled={(!selectedCamera && !dollyMode) || (!selectedDolly && dollyMode)} onClick={handleEdit}>
          {/** This should open the tree with selected camera node so location, name props can all be changed in one place. */}
          <EditIcon />
        </IconButton>
        <IconButton color="error" title="Delete Camera/Dolly" 
         disabled={(!selectedCamera && !dollyMode) || (!selectedDolly && dollyMode)} onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
        <IconButton color="primary" title="Save to File" 
            disabled={(!selectedCamera && !dollyMode) || (!selectedDolly && dollyMode)}
            onClick={function() { handleSaveCamerasOrDollies();}}>
          <SaveTwoToneIcon />
        </IconButton>
        <IconButton color="primary" title="Load from File" 
          onClick={function() { handleLoadCamerasOrDollies();}}>
          <FileOpenTwoToneIcon />
        </IconButton>
      </Stack>
      </FormControl>
      <DollyEditorDialog
          open={dollyEditorOpen}
          edit={editMode}
          onClose={function() {setDollyEditorOpen(false)}}
          uiState={curState}
      />
    </>
  )
}

export default observer(CameraPanel);