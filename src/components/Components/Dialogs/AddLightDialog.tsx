import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import * as THREE from 'three';
import { ModelUIState } from '../../../state/ModelUIState';
import Autocomplete from '@mui/material/Autocomplete';

interface AddLightDialogProps {
  open: boolean;
  onClose: () => void;
  onAddLight: (name: string | undefined, type: any, uiState: ModelUIState, parent: THREE.Object3D | null) => void;
  scene: THREE.Scene | null;
  uiState: ModelUIState;
  parent: THREE.Object3D | null;
}

const AddLightDialog: React.FC<AddLightDialogProps> = ({ open, onClose, onAddLight, scene, uiState, parent }) => {
  const [lightName, setLightName] = useState("NewLight");
  const [lightType, setLightType] = useState("SpotLight")

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Light</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Light Name"
          fullWidth
          value={lightName}
          onChange={(e) => setLightName(e.target.value)}
        />
      </DialogContent>
      <DialogContent>
        <Autocomplete
          options={['DirectionalLight', 'PointLight', 'SpotLight']}
          value={lightType}
          onChange={(_:any, newValue:any) => setLightType(newValue ?? '')}
          renderInput={(params:any) => (
            <TextField
              {...params}
              autoFocus
              margin="dense"
              label="Light Type"
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
                onAddLight(lightName.trim() || "NewLight", lightType.trim() || "SpotLight", uiState, parent);

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

export default AddLightDialog;
