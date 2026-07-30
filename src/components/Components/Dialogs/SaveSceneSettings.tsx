import React, { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SaveOptions {
  dollies: boolean;
  modelOffsets: boolean;
  cameraPosition: boolean;
}

interface SaveSceneSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (options: SaveOptions, scene: THREE.Scene | null) => void;
  scene: THREE.Scene | null;
}

function SaveSceneSettingsDialog({ open, onClose, onSave, scene }: SaveSceneSettingsDialogProps) {
  const [options, setOptions] = useState<SaveOptions>({
    dollies: true,
    modelOffsets: true,
    cameraPosition: true,
  });
  const dScene = scene;
  const handleToggle = (key: keyof SaveOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(options, dScene);
    onClose();
  };

  const noneSelected = !options.dollies && !options.modelOffsets && !options.cameraPosition;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}
      >
        Save
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={options.dollies}
                onChange={() => handleToggle('dollies')}
              />
            }
            label="Dollies"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.modelOffsets}
                onChange={() => handleToggle('modelOffsets')}
              />
            }
            label="Model Offsets"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.cameraPosition}
                onChange={() => handleToggle('cameraPosition')}
              />
            }
            label="Current Camera Position"
          />
        </FormGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Box component="div" sx={{ flex: 1 }} />
        <Button variant="contained" onClick={handleSave} disabled={noneSelected}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaveSceneSettingsDialog;