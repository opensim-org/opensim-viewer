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
  Slider,
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

  const [trimMotion, setTrimMotion] = useState(false);
  const [loopsToRecord, setLoopsToRecord] = useState<string>("1");
  const [startTime, setStartTime] = useState<string>("0.0");
  const [endTime, setEndTime] = useState<string>("1.0");
  const [maxLoops] = useState<number>(10); // Limited to 10 to avoid long waiting times.

  // Slider range state
  const [timeRange, setTimeRange] = useState<number[]>([0, 1]);
  const [maxTime, setMaxTime] = useState<number>(10);

  // Get the current animation duration
  const getCurrentAnimationDuration = (): number => {
    const currentIndex = viewerState.currentAnimationIndices[0];
    if (currentIndex !== undefined && currentIndex >= 0 && currentIndex < viewerState.animations.length) {
      const animation = viewerState.animations[currentIndex];
      // Subtract the start time offset to get the effective duration
      const startTimeOffset = viewerState.animationStartTimes[currentIndex] || 0;
      return Math.max(0, animation.duration - startTimeOffset);
    }
    return 10; // Default fallback
  };

  // Update max time and slider range when animation changes or modal opens
  useEffect(() => {
    if (open) {
      const duration = getCurrentAnimationDuration();
      setMaxTime(Math.max(1, duration)); // Ensure at least 1 second

      // Update end time to match animation duration
      const newEndTime = Math.max(1, duration);
      setEndTime(String(newEndTime));
      viewerState.setVideoRecorderEndTime(newEndTime);

      // Update slider range
      setTimeRange([0, newEndTime]);
    }
  }, [open, viewerState.currentAnimationIndices, viewerState.animations]);

  // Watch for animation changes while modal is open
  useEffect(() => {
    if (open) {
      const duration = getCurrentAnimationDuration();
      setMaxTime(Math.max(1, duration));

      // Only update if the current end time exceeds the new duration
      const currentEndTime = parseFloat(endTime);
      if (currentEndTime > duration || isNaN(currentEndTime)) {
        const newEndTime = Math.max(1, duration);
        setEndTime(String(newEndTime));
        viewerState.setVideoRecorderEndTime(newEndTime);
        setTimeRange([timeRange[0], newEndTime]);
      }
    }
  }, [viewerState.animations, viewerState.currentAnimationIndices]);

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
      if(viewerState.isTrimmingMotion) {
        setTrimMotion(viewerState.isTrimmingMotion)
      }

      // Set num loops to record
      if(viewerState.videoRecorderNumLoops) {
        setLoopsToRecord(String(viewerState.videoRecorderNumLoops))
      }

      // Set start time
      if(viewerState.videoRecorderStartTime) {
        setStartTime(String(viewerState.videoRecorderStartTime))
        // Initialize slider start value
        setTimeRange(prev => [viewerState.videoRecorderStartTime, prev[1]]);
      }

      // Set end time
      const duration = getCurrentAnimationDuration();
      const currentEndTime = viewerState.videoRecorderEndTime || duration;
      setEndTime(String(Math.min(currentEndTime, duration)));
      setTimeRange(prev => [prev[0], Math.min(currentEndTime, duration)]);
      setMaxTime(Math.max(1, duration));
    }
  }, [open, viewerState]);

  useEffect(() => {
    const validFpsOptions = getFpsOptions();
    if (!validFpsOptions.includes(selectedFPS)) {
      setSelectedFPS(validFpsOptions[0]);
      viewerState.setRecorderFPS(validFpsOptions[0]);
    }
  }, [selectedFormat]);

  const handleVideoNameChange = (event:any) => {
    viewerState.setRecordedVideoName(event.target.value)
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

  const handleIsTrimmingMotion = (value: boolean) => {
    setTrimMotion(value)
    viewerState.setIsTrimmingMotion(value)
  };

  const handleLoopsChange = (value: string) => {
    if (value === "" || validateInteger(value)) {
        setLoopsToRecord(value);

        // Only update viewer state if we have a valid number
        if (value !== "") {
            const numValue = parseInt(value, 10);
            // Clamp the value for the viewer state
            const clampedValue = Math.min(Math.max(1, numValue), maxLoops);
            viewerState.setVideoRecorderNumLoops(clampedValue);
        }
    }
  };

  // Handle slider change with two handlers
  const handleTimeRangeChange = (event: Event, newValue: number | number[]) => {
    const range = newValue as number[];
    setTimeRange(range);

    // Update start time
    const startValue = range[0];
    setStartTime(String(startValue));
    viewerState.setVideoRecorderStartTime(startValue);

    // Update end time
    const endValue = range[1];
    setEndTime(String(endValue));
    viewerState.setVideoRecorderEndTime(endValue);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    // Only update the viewer state if it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue < timeRange[1]) {
      viewerState.setVideoRecorderStartTime(numValue);
      // Update slider
      setTimeRange([numValue, timeRange[1]]);
    }
  }

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    // Only update the viewer state if it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue > timeRange[0] && numValue <= maxTime) {
      viewerState.setVideoRecorderEndTime(numValue);
      // Update slider
      setTimeRange([timeRange[0], numValue]);
    }
  }

 const validateTimeFormat = (time: string): boolean => {
    // Allow empty string or valid number format
    if (time === "") return true;
    // Allow format: digits with optional decimal point and up to 3 decimal places
    const regex = /^\d+(\.\d{1,3})?$/;
    return regex.test(time);
  };

 const validateInteger = (integer: string): boolean => {
    // Allow empty string or valid number format
    if (integer === "") return true;
    // Allow format: digits with no decimal point
    const regex = /^\d+$/;
    return regex.test(integer);
  };

  // Calculate slider marks based on maxTime
  const getSliderMarks = () => {
    if (maxTime <= 5) {
      return [
        { value: 0, label: '0' },
        { value: maxTime, label: `${maxTime.toFixed(1)}s` }
      ];
    }
    return [
      { value: 0, label: '0' },
      { value: Math.floor(maxTime / 2), label: `${Math.floor(maxTime / 2)}s` },
      { value: maxTime, label: `${maxTime.toFixed(1)}s` }
    ];
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="recording-dialog" style={{ zIndex: 1001 }}>
      <DialogTitle>{t("bottomBar.record")}</DialogTitle>

      <DialogContent sx={{ minWidth: 300 }}>

        {/* Video Name */}
        <FormControl fullWidth margin="dense">
           <TextField
            size="small"
            label={t('recordView.video_name_label')}
            value={viewerState.recordedVideoName}
            onChange={handleVideoNameChange}
          />
        </FormControl>

        {/* Aspect Ratio */}
        {curState.showAspectRatioFunctionality && (
          <FormControl fullWidth margin="dense" sx={{ marginTop: 1 }}>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={selectedAspectRatio}
              label="Aspect Ratio"
              size="small"
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

        {/* Quality Level */}
        <FormControl fullWidth margin="dense" sx={{ marginTop: 1 }}>
          <InputLabel>Quality Level</InputLabel>
          <Select
            value={selectedQuality}
            label="Quality Level"
            size="small"
            onChange={(e) => handleQualityChange(e.target.value)}
          >
            {qualityLevels.map((quality) => (
              <MenuItem key={quality.label} value={quality.label}>
                {quality.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Video Format */}
        <FormControl fullWidth margin="dense" sx={{ marginTop: 1 }}>
          <InputLabel>Video Format</InputLabel>
          <Select
            value={selectedFormat}
            label="Video Format"
            size="small"
            onChange={(e) => handleFormatChange(e.target.value)}
          >
            {videoFormats.map((fmt) => (
              <MenuItem key={fmt.value} value={fmt.value}>
                {fmt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* FPS */}
        <FormControl fullWidth margin="dense" sx={{ marginTop: 1 }}>
          <InputLabel>FPS</InputLabel>
          <Select
            value={selectedFPS}
            label="FPS"
            size="small"
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


          {/* Number of loops */}
          <div style={{ marginTop: 1 }}>
            <TextField
              fullWidth
              label="Number of loops to record"
              value={loopsToRecord}
              size="small"
              onChange={(e) => handleLoopsChange(e.target.value)}
              error={String(loopsToRecord) !== "" && !validateInteger(String(loopsToRecord))}
              margin="dense"
            />
          </div>

          {/* Checkbox: Record full animation or custom times */}
          <FormControlLabel
            control={
              <Checkbox
                checked={trimMotion}
                onChange={(e) => handleIsTrimmingMotion(e.target.checked)}
                name="trimMotion"
                size="small"
              />
            }
            label="Trim Motion"
          />

          {/* Custom times section - only shown when not recording full animation */}
          {trimMotion && (
            <div style={{ marginTop: 1 }}>
              {/* Display current animation duration */}
              <div style={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                marginBottom: '8px'
              }}>
                Motion duration: {maxTime.toFixed(2)}s
              </div>

              {/* Dual-handle slider */}
              <div>
                <Slider
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  valueLabelDisplay="auto"
                  size="small"
                  min={0}
                  max={maxTime}
                  step={0.1}
                  marks={getSliderMarks()}
                />
              </div>

              {/* Text fields for manual input */}
              <div style={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Start time (s)"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  placeholder="e.g., 0.5"
                  size="small"
                  error={startTime !== "" && !validateTimeFormat(startTime)}
                  margin="dense"
                />
                <TextField
                  fullWidth
                  label="End time (s)"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  placeholder="e.g., 5.0"
                  size="small"
                  error={endTime !== "" && !validateTimeFormat(endTime)}
                  helperText={`Max: ${maxTime.toFixed(2)}s`}
                  margin="dense"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default observer(RecordingModal);