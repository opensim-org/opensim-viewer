import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import * as THREE from 'three';
import { ModelUIState } from '../../../state/ModelUIState';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslation } from 'react-i18next'

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

  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("addLightDialog.add_new_light")}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t("addLightDialog.light_name")}
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
              label={t("addLightDialog.light_type")}
              fullWidth
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("addLightDialog.cancel")}</Button>
        <Button
          onClick={() => {
              if (scene) {
                onAddLight(lightName.trim() || "NewLight", lightType.trim() || "SpotLight", uiState, parent);

                onClose();
              }
            }
          }
        >
          {t("addLightDialog.add_light")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLightDialog;
