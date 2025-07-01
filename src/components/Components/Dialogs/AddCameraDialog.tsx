import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import * as THREE from 'three';
import { ModelUIState } from '../../../state/ModelUIState';
import Autocomplete from '@mui/material/Autocomplete';

interface AddCameraDialogProps {
  open: boolean;
  onClose: () => void;
  onAddCamera: (name: string | undefined, type: any, uiState: ModelUIState, camerasGroup: THREE.Group) => void;
  scene: THREE.Scene | null;
  uiState: ModelUIState;
}

const AddCameraDialog: React.FC<AddCameraDialogProps> = ({ open, onClose, onAddCamera, scene, uiState }) => {
  const [cameraName, setCameraName] = useState("NewCamera");
  const [cameraType, setCameraType] = useState("PerspectiveCamera");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Camera</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Camera Name"
          fullWidth
          value={cameraName}
          onChange={(e) => setCameraName(e.target.value)}
        />
      </DialogContent>
      <DialogContent>
        <Autocomplete
          options={['PerspectiveCamera', 'OrthographicCamera']}
          value={cameraType}
          onChange={(_:any, newValue:any) => setCameraType(newValue ?? '')}
          renderInput={(params:any) => (
            <TextField
              {...params}
              autoFocus
              margin="dense"
              label="Camera Type"
              fullWidth
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => {
              if (scene) {
                const camerasGroup = scene.getObjectByName('Cameras') as THREE.Group;
                if (camerasGroup) {
                  onAddCamera(cameraName.trim() || "NewCamera", cameraType.trim() || "SpotLight", uiState, camerasGroup);
                }
                onClose();
              }
            }
          }
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCameraDialog;
