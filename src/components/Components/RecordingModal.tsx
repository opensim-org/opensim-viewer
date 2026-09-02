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
  InputAdornment,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useModelContext } from "../../state/ModelUIStateContext";
import { observer } from "mobx-react";

interface RecordingModalProps {
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
  { label: "JPEG (Zip)", value: "zip" },
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
  const maxLoops = 10; // Limited to 10 to avoid long waiting times.

  // Slider range state
  const [timeRange, setTimeRange] = useState<number[]>([0, 1]);
  const [maxTime, setMaxTime] = useState<number>(10);
  const [animationStartOffset, setAnimationStartOffset] = useState<number>(0);

  // Get the current animation absolute end time and start offset
  const getCurrentAnimationInfo = (): { duration: number; startOffset: number } => {
    const currentIndex = viewerState.currentAnimationIndices[0];
    if (currentIndex !== undefined && currentIndex >= 0 && currentIndex < viewerState.animations.length) {
      const animation = viewerState.animations[currentIndex];
      const startOffset = viewerState.animationStartTimes[currentIndex] ?? 0;
      // animation.duration is the absolute end time of the animation.
      // startOffset is the absolute start time of the animation.
      return {
        duration: animation.duration,
        startOffset
      };
    }
    return { duration: 10, startOffset: 0 };
  };

  // Update max time and slider range when animation changes or modal opens
  useEffect(() => {
    if (!open) return;

    const { duration, startOffset } = getCurrentAnimationInfo();

    setMaxTime(duration);
    setAnimationStartOffset(startOffset);

    const savedStartTime = viewerState.videoRecorderStartTime;
    const savedEndTime = viewerState.videoRecorderEndTime;

    const startTime =
      savedStartTime >= startOffset && savedStartTime < duration
        ? savedStartTime
        : startOffset;

    const endTime =
      savedEndTime > startTime && savedEndTime <= duration
        ? savedEndTime
        : duration;

    setStartTime(startTime.toFixed(1));
    setEndTime(endTime.toFixed(1));
    setTimeRange([startTime, endTime]);

    viewerState.setVideoRecorderStartTime(startTime);
    viewerState.setVideoRecorderEndTime(endTime);
  }, [open, viewerState.currentAnimationIndices, viewerState.animations]);

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
    }
  }, [open, viewerState]);

  useEffect(() => {
    const validFpsOptions = getFpsOptions();
    if (!validFpsOptions.includes(selectedFPS)) {
      setSelectedFPS(validFpsOptions[0]);
      viewerState.setRecorderFPS(validFpsOptions[0]);
    }
  }, [selectedFormat]);

 const getVideoNameWithoutExtension = () => {
    const currentName = viewerState.recordedVideoName || "";
    const extension = `.${selectedFormat}`;

    if (currentName.toLowerCase().endsWith(extension.toLowerCase())) {
      return currentName.slice(0, -extension.length);
    }

    const knownExtensions = videoFormats.map((format) => `.${format.value}`);
    const existingExtension = knownExtensions.find((ext) =>
      currentName.toLowerCase().endsWith(ext.toLowerCase())
    );

    if (existingExtension) {
      return currentName.slice(0, -existingExtension.length);
    }

    return currentName;
  };

  const handleVideoNameChange = (event:any) => {
    const nameWithoutExtension = event.target.value;
    viewerState.setRecordedVideoName(`${nameWithoutExtension}.${selectedFormat}`)
  };

  const handleFormatChange = (value: string) => {
    const currentName = viewerState.recordedVideoName || "";
    const knownExtensions = videoFormats.map((format) => `.${format.value}`);
    const existingExtension = knownExtensions.find((ext) =>
      currentName.toLowerCase().endsWith(ext.toLowerCase())
    );

    const nameWithoutExtension = existingExtension
      ? currentName.slice(0, -existingExtension.length)
      : currentName;

    setSelectedFormat(value);
    viewerState.setRecordedVideoFormat(value);
    viewerState.setRecordedVideoName(`${nameWithoutExtension}.${value}`);
  };

  const handleFPSChange = (value: number) => {
    setSelectedFPS(value);
    viewerState.setRecorderFPS(value);
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

    // If trimming is disabled, reset to full animation
    if (!value) {
      const { duration, startOffset } = getCurrentAnimationInfo();
      const roundedStart = startOffset;
      const roundedEnd = duration;

      setStartTime(roundedStart.toFixed(1));
      setEndTime(roundedEnd.toFixed(1));
      setTimeRange([roundedStart, roundedEnd]);

      viewerState.setVideoRecorderStartTime(roundedStart);
      viewerState.setVideoRecorderEndTime(roundedEnd);
    }
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

    const start = range[0];
    const end = range[1];

    setTimeRange([start, end]);
    setStartTime(start.toFixed(1));
    setEndTime(end.toFixed(1));

    viewerState.setVideoRecorderStartTime(start);
    viewerState.setVideoRecorderEndTime(end);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);

    const numValue = parseFloat(value);

    if (
      !isNaN(numValue) &&
      numValue >= animationStartOffset &&
      numValue < timeRange[1]
    ) {
      const roundedValue = numValue;
      setTimeRange([roundedValue, timeRange[1]]);
      viewerState.setVideoRecorderStartTime(roundedValue);
    }
  }

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);

    const numValue = parseFloat(value);

    if (
      !isNaN(numValue) &&
      numValue > timeRange[0] &&
      numValue <= maxTime
    ) {
      const roundedValue = numValue;
      setTimeRange([timeRange[0], roundedValue]);
      viewerState.setVideoRecorderEndTime(roundedValue);
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
    const start = animationStartOffset;
    const end = maxTime;
    const range = end - start;

    if (range <= 5) {
      return [
        { value: start, label: `${start.toFixed(1)}s` },
        { value: end, label: `${end.toFixed(1)}s` }
      ];
    }

    const middle = start + range / 2;

    return [
      { value: start, label: `${start.toFixed(1)}s` },
      { value: middle, label: `${middle.toFixed(1)}s` },
      { value: end, label: `${end.toFixed(1)}s` }
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
             value={getVideoNameWithoutExtension()}
             onChange={handleVideoNameChange}
             InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    .{selectedFormat}
                  </InputAdornment>
                ),
              }}
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
              error={loopsToRecord !== "" && !validateInteger(loopsToRecord)}
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
                Motion duration: {(maxTime - animationStartOffset).toFixed(1)}s
                {animationStartOffset > 0 && (
                  <div>
                    Animation timeline: {animationStartOffset.toFixed(1)}s – {maxTime.toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Dual-handle slider */}
              <div>
                <Slider
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  valueLabelDisplay="auto"
                  size="small"
                  min={animationStartOffset}
                  max={maxTime}
                  step={0.1}
                  marks={getSliderMarks()}
                  valueLabelFormat={(value) => `${value.toFixed(1)}s`}
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
                  margin="dense"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default observer(RecordingModal);