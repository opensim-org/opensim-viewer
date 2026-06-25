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
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useModelContext } from "../../state/ModelUIStateContext";
import { observer } from "mobx-react";

interface RecordingModalProps {
  videoRecorderRef: React.MutableRefObject<any>;
  open: boolean;
  onClose: () => void;
}

// Define quality levels that will be used as base dimensions. Base dimension is width.
const qualityLevels = [
  { label: "1080p HD", baseDimension: 1920 },
  { label: "1440p HD", baseDimension: 2560 },
  { label: "2160p 4K", baseDimension: 3840 },
];

const videoFormats = [
  { label: "MP4", value: "mp4" },
  { label: "MOV", value: "mov" },
  { label: "JPEG (Zip)", value: "jpeg-zip" },
  { label: "GIF", value: "gif" },
];

const fpsValues = [30, 60];
const fpsValuesGif = [25, 50];

const aspectRatios = [
  { label: "4:3", value: "4:3", description: "standard" },
  { label: "16:9", value: "16:9", description: "widescreen" },
  { label: "21:9", value: "21:9", description: "ultrawide" },
  { label: "9:16", value: "9:16", description: "vertical" },
  { label: "1:1", value: "1:1", description: "square" },
  { label: "3:2", value: "3:2", description: "photo size" },
];

const RecordingModal: React.FC<RecordingModalProps> = ({
  videoRecorderRef,
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const curState = useModelContext();
  const viewerState = curState.viewerState;

  const [selectedQuality, setSelectedQuality] = useState("1080p HD");
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [selectedFPS, setSelectedFPS] = useState(30);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9");

  const [recordFullAnimation, setRecordFullAnimation] = useState(true);
  const [iterationsToRecord, setIterationsToRecord] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>("0.0");
  const [endTime, setEndTime] = useState<string>("1.0");
  const [maxIterations, setMaxIterations] = useState<number>(10);

  const getFpsOptions = () => {
    return selectedFormat === "gif" ? fpsValuesGif : fpsValues;
  };

  // Initialize state from viewerState when modal opens
  useEffect(() => {
    if (open) {
      // Set quality from base dimension
      const baseDimension = viewerState.videoRecorderBaseDimension;
      const matchingQuality = qualityLevels.find(
        (q) => q.baseDimension === baseDimension
      );
      if (matchingQuality) {
        setSelectedQuality(matchingQuality.label);
      } else if (baseDimension) {
        // If no match found, you might want to add a custom quality or handle it differently
        console.warn(`No matching quality found for base dimension: ${baseDimension}`);
      }

      // Set format
      if (viewerState.recordedVideoFormat) {
        setSelectedFormat(viewerState.recordedVideoFormat);
      }

      // Set FPS
      if (viewerState.recordedVideoFPS) {
        setSelectedFPS(viewerState.recordedVideoFPS);
      }

      // Set aspect ratio
      if (viewerState.recordedVideoAspectRatio) {
        setSelectedAspectRatio(viewerState.recordedVideoAspectRatio);
      }

      // Set is recording full animation
      if(viewerState.isRecordingFullAnimation) {
        setRecordFullAnimation(viewerState.isRecordingFullAnimation)
      }

      // Set num iterations to record
      if(viewerState.videoRecorderNumIterations) {
        setIterationsToRecord(viewerState.videoRecorderNumIterations)
      }

      // Set start time
      if(viewerState.videoRecorderStartTime) {
        setStartTime(String(viewerState.videoRecorderStartTime))
      }

      // Set end time
      if(viewerState.videoRecorderEndTime) {
        setEndTime(String(viewerState.videoRecorderEndTime))
      }
    }
  }, [open, viewerState]);

  useEffect(() => {
    const validFpsOptions = getFpsOptions();
    if (!validFpsOptions.includes(selectedFPS)) {
      setSelectedFPS(validFpsOptions[0]);
      viewerState.setRecorderFPS(validFpsOptions[0]);
    }
  }, [selectedFormat]);

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

  const handleIsRecordingFullAnimation = (value: boolean) => {
    setRecordFullAnimation(value)
    viewerState.setIsRecordingFullAnimation(value)
  };

  const handleIterationsChange = (value: number) => {
    const clampedValue = Math.min(Math.max(1, value), maxIterations);
    setIterationsToRecord(clampedValue);
    viewerState.setVideoRecorderNumIterations(clampedValue)
  };

  const handleStartTimeChange = (value: number) => {
    setStartTime(String(value))
    viewerState.setVideoRecorderStartTime(value)
  }

  const handleEndTimeChange = (value: number) => {
    setEndTime(String(value))
    viewerState.setVideoRecorderEndTime(value)
  }

  const validateTimeFormat = (time: string): boolean => {
    // Validate format: seconds.milliseconds (e.g., 1.5, 10.250)
    const regex = /^\d+\.\d{1,3}$/;
    return regex.test(time);
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="recording-dialog" style={{ zIndex: 1001 }}>
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

        {/* Aspect Ratio */}
        {curState.showAspectRatioFunctionality && (
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
        )}

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

        {/* Recording Options Section */}
        <div
          style={{
            marginTop: "24px",
            borderTop: "1px solid #e0e0e0",
            paddingTop: "16px",
          }}
        >
          {/* Checkbox: Record full animation or custom times */}
          <FormControlLabel
            control={
              <Checkbox
                checked={recordFullAnimation}
                onChange={(e) => handleIsRecordingFullAnimation(e.target.checked)}
                name="recordFullAnimation"
              />
            }
            label="Record full animation"
          />

          {/* Number of iterations */}
          <div style={{ marginTop: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Number of iterations to record"
              value={iterationsToRecord}
              onChange={(e) => handleIterationsChange(Number(e.target.value))}
              inputProps={{
                min: 1,
                max: maxIterations,
                step: 1
              }}
              margin="dense"
            />
          </div>

          {/* Custom times section - only shown when not recording full animation */}
          {!recordFullAnimation && (
            <div style={{ marginTop: 2, display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Start time (s)"
                value={startTime}
                onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                placeholder="e.g., 0.5"
                error={!validateTimeFormat(startTime)}
                margin="dense"
              />
              <TextField
                fullWidth
                label="End time (s)"
                value={endTime}
                onChange={(e) => handleEndTimeChange(Number(e.target.value))}
                placeholder="e.g., 5.0"
                error={!validateTimeFormat(endTime)}
                margin="dense"
              />
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

export default observer(RecordingModal);