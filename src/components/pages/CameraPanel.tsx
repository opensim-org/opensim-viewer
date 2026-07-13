import React, { useCallback, useEffect, useState } from 'react'
import {
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Stack,
  InputLabel,
  SelectChangeEvent,
  ListItemIcon
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
import { OpenSimControlHandle } from '../Components/OpenSimControl'

type CameraPanelProps = {
  uState: ModelUIState;
  controlsRef: OpenSimControlHandle | null;
}

function CameraPanel(props :CameraPanelProps) {
  const [selectedDolly, setSelectedDolly] = useState('')
  const [availableCameras, setAvailableCameras] = useState<Camera[]>(props.uState.viewerState.cameras);
  const [availableDollies, setAvailableDollies] = useState<CameraDolly[]>(props.uState.viewerState.cameraDollies);
  const [dollyEditorOpen, setDollyEditorOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const curState = props.uState;
  const passedControls = props.controlsRef;
  
  const handleCameraChange = useCallback((cameraName: string) => {
    const targetName = cameraName
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
    if (curState.viewerState.cameraDollies.length > 0 && curState.viewerState.currentDollyIndex !== -1) {
      const currentDolly = curState.viewerState.cameraDollies[curState.viewerState.currentDollyIndex];
      setSelectedDolly(currentDolly.name);
      handleDollyChange(currentDolly.name);
    }
    else if (curState.viewerState.currentDollyIndex === -1){
      setSelectedDolly("")
    }
    return () => {
      // Optional cleanup logic
    };
  }, [availableCameras, curState.viewerState.cameraDollies, curState.viewerState.currentDollyIndex, curState.viewerState.cameras, 
      curState.viewerState.cameras.length, curState.viewerState.currentCameraIndex, 
      curState.viewerState.animationsNeedUpdate, handleCameraChange, handleDollyChange]);
  

  const handleAdd = function() {
    setEditMode(false)
    setDollyEditorOpen(true)
  }

  const handleEdit = function() {
    setEditMode(true);
    setDollyEditorOpen(true)
  }

  const handleDelete = function() {
      curState.viewerState.deleteCurrentDolly();
   }


  const handleSaveDollies = function() {
    const json = curState.viewerState.saveDolliesToJson();
    // query for file name and save
    const defaultName = "dollies.json";
    const fileName = window.prompt("Enter file name:", defaultName) || defaultName;
    saveAs(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), fileName);
  }

  const handleLoadDollies = function() {
      // Create a file input element to select the JSON file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const json = e.target?.result;
            //console.log("Loaded dollies json: ", json);
            if (json) {
              curState.viewerState.loadDolliesFromJson(JSON.parse(json as string));
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };

  return (
    <>
      <FormControl margin="dense" size="small" variant="standard" >
      <Stack direction="row">
        <IconButton color="primary" title="Add Dolly" onClick={handleAdd}>
          <AddIcon />
        </IconButton>
        <IconButton color="info" title="Edit Dolly" 
        disabled={(!selectedDolly)} onClick={handleEdit}>
          {/** This should open the tree with selected camera node so location, name props can all be changed in one place. */}
          <EditIcon />
        </IconButton>
        <IconButton color="error" title="Delete Dolly" 
         disabled={(!selectedDolly)} onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
        <IconButton color="primary" title="Save to File" 
            disabled={(!selectedDolly )}
            onClick={function() { handleSaveDollies();}}>
          <SaveTwoToneIcon />
        </IconButton>
        <IconButton color="primary" title="Load from File" 
          onClick={function() { handleLoadDollies();}}>
          <FileOpenTwoToneIcon />
        </IconButton>
      </Stack>
      </FormControl>
      <DollyEditorDialog
          open={dollyEditorOpen}
          edit={editMode}
          onClose={function() {setDollyEditorOpen(false)}}
          uiState={curState}
          controlsRef={passedControls}
      />
    </>
  )
}

export default observer(CameraPanel);