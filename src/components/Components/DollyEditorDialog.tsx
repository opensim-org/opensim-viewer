import {
  TextField,
  Button,
  List,
  ListItem,
  Select,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import React from "react";
import { ModelUIState } from "../../state/ModelUIState";

type CameraType = "fixed" | "attached" | "animated";

type CameraEntry = {
  id: string;
  name: string;
  time: number;

};

interface DollyDialogProps {
  open: boolean;
  onClose: () => void;
  uiState: ModelUIState;
}

const DollyEditorDialog: React.FC<DollyDialogProps> = ({ open, onClose, uiState}) => {
  const [cameras, setCameras] = React.useState<CameraEntry[]>([]);
  const cameraList = React.useState(uiState.viewerState.cameras);
  const addCamera = () => {
    setCameras(prev => [
      ...prev,
      {
        id: "",
        name: `Camera ${prev.length + 1}`,
        time: 0,
      },
    ]);
  };

  const updateCamera = (id: string, updated: Partial<CameraEntry>) => {
    setCameras(prev =>
      prev.map(cam => (cam.id === id ? { ...cam, ...updated } : cam))
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Camera Timeline</DialogTitle>
        <DialogContent>
          <List>
            {cameras.map(cam => (
              <ListItem key={cam.id} sx={{ gap: 2 }}>
                <TextField
                  label="Name"
                  value={cam.name}
                  onChange={e => updateCamera(cam.id, { name: e.target.value })}
                  size="small"
                />
                <TextField
                  label="Time (s)"
                  type="number"
                  value={cam.time}
                  onChange={e =>
                    updateCamera(cam.id, { time: parseFloat(e.target.value) })
                  }
                  size="small"
                  sx={{ width: 100 }}
                />
              </ListItem>
            ))}
          </List>
          <Button onClick={addCamera} variant="contained" sx={{ mt: 2 }}>
            Add Camera
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
  );
};

export default DollyEditorDialog;