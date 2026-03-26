import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import VideoCameraFrontTwoToneIcon from "@mui/icons-material/VideoCameraFrontTwoTone";
import { useTranslation } from "react-i18next";
import { useModelContext } from "../../state/ModelUIStateContext";
import { observer } from "mobx-react";

interface RecordingModalProps {
  videoRecorderRef: React.MutableRefObject<any>;
}

// Define quality levels that will be used as base dimensions
const qualityLevels = [
  { label: "1080p HD", baseDimension: 1080 },
  { label: "1440p HD", baseDimension: 1440 },
  { label: "2160p 4K", baseDimension: 2160 },
//  { label: "4320p 8K", baseDimension: 4320 },
];

const videoFormats = [
  { label: "MP4", value: "mp4" },
  { label: "MOV", value: "mov" },
  { label: "JPEG (Zip)", value: "jpeg-zip"},
  { label: "GIF", value: "gif"}
];

const fpsValues = [30, 60/*, 120*/];
const fpsValuesGif = [25, 50];

const aspectRatios = [
  { label: "4:3", value: "4:3", description: "standard" },
  { label: "16:9", value: "16:9", description: "widescreen" },
  { label: "21:9", value: "21:9", description: "ultrawide" },
  { label: "9:16", value: "9:16", description: "vertical" },
  { label: "1:1", value: "1:1", description: "square" },
  { label: "3:2", value: "3:2", description: "photo size" },
];

const RecordingModal: React.FC<RecordingModalProps> = ({ videoRecorderRef }) => {
  const { t } = useTranslation();
  const curState = useModelContext();
  const viewerState = curState.viewerState;

  const [open, setOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("1080p HD");
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [selectedFPS, setSelectedFPS] = useState(30);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getFpsOptions = () => {
    return selectedFormat === 'gif' ? fpsValuesGif : fpsValues;
  };

  useEffect(() => {
    const validFpsOptions = getFpsOptions();
    if (!validFpsOptions.includes(selectedFPS)) {
      setSelectedFPS(validFpsOptions[0]);
      viewerState.setRecorderFPS(validFpsOptions[0]);
    }
  }, [selectedFormat]);

  const handleRecord = () => {
    setOpen(false);

    if (videoRecorderRef?.current && !viewerState.isRecordingVideo) {
      videoRecorderRef.current.startRecording();
    }
  };

  const handleFormatChange = (value: string) => {
    setSelectedFormat(value);
    viewerState.setRecordedVideoFormat(value);
  };

  const handleFPSChange = (value: number) => {
    setSelectedFPS(Number(value));
    viewerState.setRecorderFPS(Number(value));
  };

  const handleAspectRatioChange = (value: string) => {
    setSelectedAspectRatio(value);
    viewerState.setRecorderAspectRatio(value);
  };

  const handleQualityChange = (value: string) => {
    setSelectedQuality(value);
    const chosen = qualityLevels.find((q) => q.label === value);
    if (chosen) {
      // Only set the base dimension, let the aspect ratio calculation determine final dimensions
      viewerState.setVideoRecorderBaseDimension(chosen.baseDimension);
    }
  };

  return (
    <>
      <Tooltip title={t("bottomBar.record")} placement="right">
        <IconButton
          color={
            viewerState.isProcessingVideo
              ? "warning"
              : viewerState.isRecordingVideo
              ? "error"
              : "primary"
          }
          disabled={viewerState.isProcessingVideo}
          onClick={() => {
            if (!viewerState.isRecordingVideo) handleOpen();
            else videoRecorderRef.current.stopRecording();
          }}
        >
          <VideoCameraFrontTwoToneIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} aria-labelledby="recording-dialog">
        <DialogTitle>{t("bottomBar.record")}</DialogTitle>

        <DialogContent sx={{ minWidth: 300 }}>
          {/* Video Format */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Video Format</InputLabel>
            <Select
              value={selectedFormat}
              label="Video Format"
              onChange={(e) => handleFormatChange(e.target.value)}
            >
              {videoFormats.map((fmt) => (
                <MenuItem key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Quality Level */}
          <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
            <InputLabel>Quality Level</InputLabel>
            <Select
              value={selectedQuality}
              label="Quality Level"
              onChange={(e) => handleQualityChange(e.target.value)}
            >
              {qualityLevels.map((quality) => (
                <MenuItem key={quality.label} value={quality.label}>
                  {quality.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Aspect Ratio
          <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={selectedAspectRatio}
              label="Aspect Ratio"
              onChange={(e) => handleAspectRatioChange(e.target.value)}
            >
              {aspectRatios.map((ar) => (
                <MenuItem key={ar.value} value={ar.value}>
                  {ar.label} ({ar.description})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          */}

          {/* FPS */}
          <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
            <InputLabel>FPS</InputLabel>
            <Select
              value={selectedFPS}
              label="FPS"
              onChange={(e) => handleFPSChange(Number(e.target.value))}
            >
              {getFpsOptions().map((fps) => (
                <MenuItem key={fps} value={fps}>
                  {fps}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>


        <DialogActions>
          <Button onClick={handleRecord}>Record</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default observer(RecordingModal);