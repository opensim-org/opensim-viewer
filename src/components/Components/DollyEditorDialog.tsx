import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  TextField
} from '@mui/material';

import React, { useEffect, useState } from "react";
import { ModelUIState } from "../../state/ModelUIState";
import { CameraFrame, CameraSequence } from "../../state/ViewerState";
import { Camera, Object3D, PerspectiveCamera } from "three";

type CameraEntry = {
  id: string;
  name: string;
  time: string;
  errors?: { name?: string; time?: string };
};

type Props = {
  open: boolean;
  onClose: () => void;
  uiState: ModelUIState;
};

const DollyEditorDialog: React.FC<Props> = ({ open, onClose, uiState}) => {
  const cameraOptions = uiState.viewerState.cameras.map(cam=>cam.name);

  let initalEntries: CameraEntry[] = uiState.viewerState.cameras.map((cam, index) => ({
  id: cam.uuid,
  name: cam.name,
  time: `${index}`, // default or derived from elsewhere
}));
  const [entries, setEntries] = useState<CameraEntry[]>(initalEntries);
  const [dollyName, setDollyName] = useState<string>('Dolly#')
  


  const handleChange = (index: number, field: keyof CameraEntry, value: string) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      [field]: value,
      errors: { ...updated[index].errors, [field]: validate(field, value) }
    };
    setEntries(updated);
  };

  const validate = (field: keyof CameraEntry, value: string) => {
    if (field === 'name' && !value) return 'Camera name is required';
    //if (field === 'time' && !/^([0-1]\d|2[0-3]):[0-5]\d$/.test(value)) return 'Invalid time format (HH:mm)';
    return undefined;
  };

  const addRow = () => {
    setEntries([
      ...entries,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: '',
        time: '',
        errors: {}
      }
    ]);
  };

  const deleteRow = (index: number) => {
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
  };

  const handleSave = () => {
    const validated = entries.map((entry) => ({
      ...entry,
      errors: {
        name: validate('name', entry.name),
        time: validate('time', entry.time)
      }
    }));

    const hasErrors = validated.some((entry) =>
      entry.errors?.name || entry.errors?.time
    );

    if (hasErrors) {
      setEntries(validated);
      return;
    }
    if (uiState.viewerState.currentCameraSequence===-1){
      // New Dolly, add to state and make current
      const newSequence=new CameraSequence(dollyName)
      entries.forEach((entry) => {
        // find by name in uiState.viewerState.cameras
        const ndx = uiState.viewerState.cameras.findIndex(cam=>cam.name===entry.name);
        entry.id = uiState.viewerState.cameras[ndx].uuid
      })
      
      const camFrames:CameraFrame[] = entries.map(camEntry=>({cam_uuid:camEntry.id, time:Number(camEntry.time)}));
      newSequence.cameraFrames = camFrames;
      uiState.viewerState.addCameraSequence(newSequence);
    }
    else {
      // update in-place
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Dolly</DialogTitle>
      <DialogContent>
        <TextField
          label="Dolly Name"
          value={dollyName}
          onChange={(e) => setDollyName(e.target.value)}
          fullWidth
          variant="outlined"
          margin="normal"
        />
      </DialogContent>
      <DialogContent>
        <Button variant="outlined" onClick={addRow} sx={{ mb: 2 }}>
          Add Entry
        </Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Camera Name</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Select
                    value={entry.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    fullWidth
                    error={!!entry.errors?.name}
                  >
                    {cameraOptions.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                  {entry.errors?.name && (
                    <div style={{ color: 'red', fontSize: 12 }}>{entry.errors.name}</div>
                  )}
                </TableCell>
                <TableCell>
                  <TextField
                    value={entry.time}
                    onChange={(e) => handleChange(index, 'time', e.target.value)}
                    fullWidth
                    //type="time"
                    error={!!entry.errors?.time}
                    InputLabelProps={{ shrink: true }}
                  />
                  {entry.errors?.time && (
                    <div style={{ color: 'red', fontSize: 12 }}>{entry.errors.time}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Button color="error" onClick={() => deleteRow(index)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DollyEditorDialog;