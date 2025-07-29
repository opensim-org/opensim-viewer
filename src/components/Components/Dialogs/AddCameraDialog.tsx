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
  onAddCamera: (name: string | undefined, type: any, uiState: ModelUIState, parent: THREE.Object3D | null) => void;
  scene: THREE.Scene | null;
  uiState: ModelUIState;
  parent: THREE.Object3D | null;
}

const AddCameraDialog: React.FC<AddCameraDialogProps> = ({ open, onClose, onAddCamera, scene, uiState, parent }) => {
  const [cameraName, setCameraName] = useState("NewCamera");
  const [cameraType, setCameraType] = useState("PerspectiveCamera");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Camera From View</DialogTitle>
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
                onAddCamera(cameraName.trim() || "NewCamera", cameraType.trim() || "SpotLight", uiState, parent);

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
