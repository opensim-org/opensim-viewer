import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import * as THREE from 'three';
import { ModelUIState } from '../../../state/ModelUIState';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslation } from 'react-i18next'

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

  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("addCameraDialog.add_camera_from_view")}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t("addCameraDialog.camera_name")}
          fullWidth
          value={cameraName}
          onChange={(e) => setCameraName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("addCameraDialog.cancel")}</Button>
        <Button
          onClick={() => {
              if (scene) {
                onAddCamera(cameraName.trim() || "NewCamera", 'PerspectiveCamera' || "PerspectiveCamera", uiState, parent);

                onClose();
              }
            }
          }
        >
          {t("addCameraDialog.add_camera")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCameraDialog;
