import { Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, TextField } from '@mui/material';
import React from 'react';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';

interface FormData {
  size_choice: string;
  width: number;
  height: number;
  preserve_aspect_ratio: string;
}



const SnapShotModal: React.FC<{open:boolean}> = () => {
  const [open, setOpen] = React.useState(false);
  const [changed, setChanged] = React.useState(false);

  const curState = useModelContext();
  const canvasHeight = window.document.getElementById("canvas-element")?.clientHeight
  const canvasWidth = window.document.getElementById("canvas-element")?.clientWidth
  const initialFormData: FormData = {
    size_choice: curState.snapshotProps.size_choice,
    width: curState.snapshotProps.width,
    height: curState.snapshotProps.height,
    preserve_aspect_ratio: curState.snapshotProps.preserve_aspect_ratio?"true":"false"
  };
  const [formData, setFormData] = React.useState(initialFormData);

  const handleClose = () => {
    setOpen(false);
    curState.takeSnapshot = false
  };
  const handleCapture = () => {
    setFormData(formData);
    setOpen(false);
    curState.snapshotProps.size_choice=formData.size_choice
    curState.snapshotProps.width = formData.width
    curState.snapshotProps.height = formData.height
    curState.snapshotProps.preserve_aspect_ratio = formData.preserve_aspect_ratio==="true"
    curState.takeSnapshot = true
  };
  const handleChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setFormData({ ...formData, [name]: value });

    if (formData['preserve_aspect_ratio']==="true") {
      formData['height']=formData.width*canvasHeight!/canvasWidth!
    }
    setChanged(!changed)
  };
  const handleAspectRatioChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
    formData.preserve_aspect_ratio = event.currentTarget.checked?'true':'false';
    setChanged(!changed)
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
                disabled={formData.size_choice==="screen"}
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
                disabled={formData.preserve_aspect_ratio==="true" || formData.size_choice==="screen"}
              />
              <FormControlLabel 
                  label="Preserve Aspect Ratio"
                  control={<Checkbox name="preserve_aspect_ratio" 
                    value={formData.preserve_aspect_ratio==="true"}
                    checked={formData.preserve_aspect_ratio==="true"} 
                    disabled={formData.size_choice==="screen"}
                    onChange={handleAspectRatioChange} />}
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
