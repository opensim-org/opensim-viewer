import { Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, FormLabel, IconButton, Radio, RadioGroup, Select, MenuItem, InputLabel } from '@mui/material';
import React from 'react';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';
import { useModelContext } from '../../state/ModelUIStateContext';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next'

// Define quality levels
const qualityLevels = [
  { label: "1080p HD", baseDimension: 1920 },
  { label: "1440p HD", baseDimension: 2560 },
  { label: "2160p 4K", baseDimension: 3840 },
  { label: "4320p 8K", baseDimension: 7680 },
];

const imageFormats = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "TIFF", value: "tiff" },
];

const aspectRatios = [
  { label: "4:3", value: "4:3", description: "standard" },
  { label: "16:9", value: "16:9", description: "widescreen" },
  { label: "21:9", value: "21:9", description: "ultrawide" },
  { label: "9:16", value: "9:16", description: "vertical" },
  { label: "1:1", value: "1:1", description: "square" },
  { label: "3:2", value: "3:2", description: "photo size" },
];

interface FormData {
  size_choice: string;
  preserve_aspect_ratio: string;
  transparent_background: string;
  image_format: string;
  quality_level: string;
  aspect_ratio: string;
}

const SnapShotModal: React.FC<{open:boolean}> = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [changed, setChanged] = React.useState(false);

  const curState = useModelContext();
  const initialFormData: FormData = {
    size_choice: curState.snapshotProps.size_choice,
    preserve_aspect_ratio: curState.snapshotProps.preserve_aspect_ratio?"true":"false",
    transparent_background: curState.snapshotProps.transparent_background?"true":"false",
    image_format: curState.snapshotProps.image_format || "png",
    quality_level: curState.snapshotProps.quality_level || "1080p HD",
    aspect_ratio: curState.snapshotProps.aspect_ratio || "16:9"
  };
  const [formData, setFormData] = React.useState(initialFormData);

  const handleClose = () => {
    setOpen(false);
    curState.takeSnapshot = false
  };
  const handleCapture = () => {
    setFormData(formData);
    setOpen(false);
    curState.snapshotProps.size_choice = formData.size_choice
    curState.snapshotProps.preserve_aspect_ratio = formData.preserve_aspect_ratio==="true"
    curState.snapshotProps.transparent_background = formData.transparent_background==="true"
    curState.snapshotProps.image_format = formData.image_format
    curState.snapshotProps.quality_level = formData.quality_level
    curState.snapshotProps.aspect_ratio = formData.aspect_ratio
    curState.takeSnapshot = true
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setFormData({ ...formData, [name]: value });
    setChanged(!changed)
  };
  const handleAspectRatioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formData.preserve_aspect_ratio = event.currentTarget.checked?'true':'false';
    setChanged(!changed)
  };
  const handleTransparentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formData.transparent_background = event.currentTarget.checked?'true':'false';
    setChanged(!changed)
  };
  const handleImageFormatChange = (event: any) => {
    setFormData({ ...formData, image_format: event.target.value });
    setChanged(!changed)
  };
  const handleQualityLevelChange = (event: any) => {
    setFormData({ ...formData, quality_level: event.target.value });
    setChanged(!changed)
  };
  const handleAspectRatioSelectChange = (event: any) => {
    setFormData({ ...formData, aspect_ratio: event.target.value });
    setChanged(!changed)
  };
  return (
      <>
      <Tooltip title={t('bottomBar.snapshot')} placement="right">
        <IconButton color="primary" onClick={() => {
          setOpen(true);}}>
            <PhotoCameraTwoToneIcon />
        </IconButton>
      </Tooltip>
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
                <FormControlLabel value="screen" control={<Radio />} label="Default Size" />
                <FormControlLabel value="aspect" control={<Radio />} label="Aspect Ratio" />
              </RadioGroup>

              {/* Aspect Ratio Selection - only shown when aspect ratio mode is selected */}
              {formData.size_choice === "aspect" && (
                <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
                  <InputLabel>Aspect Ratio</InputLabel>
                  <Select
                    value={formData.aspect_ratio}
                    label="Aspect Ratio"
                    onChange={handleAspectRatioSelectChange}
                  >
                    {aspectRatios.map((ar) => (
                      <MenuItem key={ar.value} value={ar.value}>
                        {ar.label} ({ar.description})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/*<FormControlLabel*/}
              {/*    label="Preserve Aspect Ratio"*/}
              {/*    control={<Checkbox name="preserve_aspect_ratio"*/}
              {/*      value={formData.preserve_aspect_ratio==="true"}*/}
              {/*      checked={formData.preserve_aspect_ratio==="true"}*/}
              {/*      disabled={formData.size_choice==="screen"}*/}
              {/*      onChange={handleAspectRatioChange} />}*/}
              {/*  />*/}
                <FormControlLabel
                  label="Make background Transparent"
                  control={<Checkbox name="transparent_background"
                    value={formData.transparent_background==="true"}
                    checked={formData.transparent_background==="true"}
                    onChange={handleTransparentChange} />}
                />

                {/* Image Format Selection */}
                <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
                  <InputLabel>Image Format</InputLabel>
                  <Select
                    value={formData.image_format}
                    label="Image Format"
                    onChange={handleImageFormatChange}
                  >
                    {imageFormats.map((fmt) => (
                      <MenuItem key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Quality Level Selection */}
                <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
                  <InputLabel>Quality Level</InputLabel>
                  <Select
                    value={formData.quality_level}
                    label="Quality Level"
                    onChange={handleQualityLevelChange}
                  >
                    {qualityLevels.map((quality) => (
                      <MenuItem key={quality.label} value={quality.label}>
                        {quality.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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