import {
  TextField,
  Button,
  List,
  ListItem,
  Select,
  MenuItem,
  Typography,
  Dialog,
} from "@mui/material";

import React from "react";
import { ModelUIState } from "../../state/ModelUIState";

type CameraType = "fixed" | "attached" | "animated";

type CameraEntry = {
  id: string;
  name: string;
  time: number;
  type?: CameraType;

};

interface DollyDialogProps {
  open: boolean;
  onClose: () => void;
  uiState: ModelUIState;
}

const DollyEditorDialog: React.FC<DollyDialogProps> = ({ open, onClose, uiState}) => {
  const [cameras, setCameras] = React.useState<CameraEntry[]>([]);

  const addCamera = () => {
    setCameras(prev => [
      ...prev,
      {
        id: "",
        name: `Camera ${prev.length + 1}`,
        time: 0,
        type: "fixed",
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
      <Typography variant="h6" gutterBottom>
        Camera Timeline
      </Typography>
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
            <Select
              value={cam.type}
              onChange={e =>
                updateCamera(cam.id, { type: e.target.value as CameraType })
              }
              size="small"
              sx={{ width: 120 }}
            >
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="attached">Attached</MenuItem>
              <MenuItem value="animated">Animated</MenuItem>
            </Select>
          </ListItem>
        ))}
      </List>
      <Button onClick={addCamera} variant="contained" sx={{ mt: 2 }}>
        Add Camera
      </Button>
    </Dialog>
  );
};

export default DollyEditorDialog;