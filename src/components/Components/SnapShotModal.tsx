import { Button, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, TextField } from '@mui/material';
import React from 'react';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';

interface FormData {
  size_choice: string;
  width: number;
  height: number;
}



const SnapShotModal: React.FC<{open:boolean}> = () => {
  const [open, setOpen] = React.useState(false);
  const curState = useModelContext();
  const initialFormData: FormData = {
    size_choice: curState.snapshotProps.size_choice,
    width: curState.snapshotProps.width,
    height: curState.snapshotProps.height,
  };
  const [formData, setFormData] = React.useState(initialFormData);

  const handleClose = () => {
    setOpen(false);
    curState.takeSnapshot = false
  };
  const handleCapture = () => {
    setFormData(formData);
    setOpen(false);
    curState.snapshotProps.width = formData.width
    curState.snapshotProps.height = formData.height
    curState.takeSnapshot = true
  };
  const handleChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
    curState.snapshotProps.size_choice = event.target.value
    const { name, value } = event.target;
      setFormData({ ...formData, [name]: value });
  };

  return (
      <>
      <IconButton color="primary" onClick={() => {
        setOpen(true);}}>
          <PhotoCameraTwoToneIcon />
      </IconButton>
      <Dialog 
        open={open}
        onClose={handleClose}
        aria-labelledby="Capture Snapshot"
      >
        <DialogContent>
          <FormControl>
              <FormLabel id="demo-controlled-radio-buttons-group">Size</FormLabel>
              <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="size_choice"
                value={formData.size_choice}
                onChange={handleChange}
              >
                <FormControlLabel value="screen" control={<Radio />} label="Screen Size" />
                <FormControlLabel value="custom" control={<Radio />} label="Custom" />
              </RadioGroup>
              <TextField
                autoFocus
                margin="dense"
                name="width"
                label="Width"
                type="text"
                variant="outlined"
                value={formData.width}
                onChange={handleChange}
              />
              <TextField
                autoFocus
                margin="dense"
                name="height"
                label="Height"
                type="text"
                variant="outlined"
                value={formData.height}
                onChange={handleChange}
              />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCapture}>Capture</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      </>
  );
}

export default SnapShotModal;
