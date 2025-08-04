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

import React, { useEffect, useState } from "react";
import { ModelUIState } from "../../state/ModelUIState";
import { CameraSequence } from "../../state/ViewerState";
import { Camera, Object3D, PerspectiveCamera } from "three";

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
  const useCameraSequence = uiState.viewerState.currentCameraSequence===-1?
                                new CameraSequence(`Dolly ${uiState.viewerState.cameraSequences.length}`):
                                uiState.viewerState.cameraSequences[uiState.viewerState.currentCameraSequence];
  const [cameraSequence, setCameraSequence] = React. useState<CameraSequence>(useCameraSequence);
  const ctt = cameraSequence.cameraTimesTargets
  let cameraList = uiState.viewerState.cameras;
  const [camTimeTrgtList, setCamTimeTrgtList] = React. useState<[Camera, number, Object3D|null][]>(ctt);
  const [selectedIndex, setSelectedIndex] = useState(0);


  const addCamera = () => {
    camTimeTrgtList.push(
           [cameraList[1], 1, null],
           [cameraList[2], 2, null],           
      );
  };

  const updateCamera = (id: string, updated: Partial<CameraEntry>) => {
    // setCamTimeTrgtList(prev =>
    //   prev.map(cam => (cam.id === id ? { ...cam, ...updated } : cam))
    // );
  };

  useEffect(() => {}, [camTimeTrgtList])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Camera Timeline</DialogTitle>
        <DialogContent>
          <List>
            {camTimeTrgtList.map(cam => (
              <ListItem sx={{ gap: 2 }}>
                <TextField
                  select
                  label="Name"
                  value="Cam Name"
                  onChange={(e) => {}}
                  variant="outlined"
                  size="small"
                 >
                {cameraList.map((cam) => (
                    <MenuItem key={cam.name} value={cam.name} sx={{ width: 100 }}>
                      {cam.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Time (s)"
                  type="number"
                  value={cam[1]}
                  onChange={e =>{
                    //updateCamera(cam[0].id, { time: parseFloat(e.target.value) });
                    }
                  }
                  size="small"
                  sx={{ width: 100 }}
                />
              </ListItem>
            ))}
          </List>
          <Button onClick={addCamera} variant="contained" sx={{ mt: 2 }}>
            Add Camera Keyframe
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Add/Update</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
  );
};

export default DollyEditorDialog;