import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import * as THREE from 'three';
import { ModelUIState } from '../../../state/ModelUIState';

interface AddCameraDialogProps {
  open: boolean;
  onClose: () => void;
  onAddCamera: (name: string | undefined, uiState: ModelUIState, camerasGroup: THREE.Group) => void;
  scene: THREE.Scene | null;
  uiState: ModelUIState;
}

const AddCameraDialog: React.FC<AddCameraDialogProps> = ({ open, onClose, onAddCamera, scene, uiState }) => {
  const [cameraName, setCameraName] = useState("NewCamera");

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
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => {
              if (scene) {
                const camerasGroup = scene.getObjectByName('Cameras') as THREE.Group;
                if (camerasGroup) {
                  onAddCamera(cameraName.trim() || "NewCamera", uiState, camerasGroup);
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
