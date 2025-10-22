import React, { useState } from "react";
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

const resolutions = [
  { label: "144p", width: 256, height: 144 },
  { label: "240p", width: 426, height: 240 },
  { label: "360p", width: 640, height: 360 },
  { label: "480p", width: 854, height: 480 },
  { label: "720p_HD", width: 1280, height: 720 },
  { label: "1080p_HD", width: 1920, height: 1080 },
  { label: "1440p_HD", width: 2560, height: 1440 },
  { label: "2160p_4K", width: 3840, height: 2160 },
];

const videoFormats = [
  { label: "WEBM", value: "webm" },
  { label: "MP4", value: "mp4" },
  { label: "MOV", value: "mov" },
];

const RecordingModal: React.FC<RecordingModalProps> = ({ videoRecorderRef }) => {
  const { t } = useTranslation();
  const curState = useModelContext();
  const viewerState = curState.viewerState;

  const [open, setOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("720p_HD");
  const [selectedFormat, setSelectedFormat] = useState("webm");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRecord = () => {
    setOpen(false);

    if (videoRecorderRef?.current && !viewerState.isRecordingVideo) {
      videoRecorderRef.current.startRecording();
    }
  };

  const handleFormatChange = (value: string) => {
    setSelectedFormat(value);
    viewerState.recordedVideoFormat = value;
  };

  const handleResolutionChange = (value: string) => {
    setSelectedResolution(value);
    const chosen = resolutions.find((r) => r.label === value);
    if (chosen) {
      viewerState.videoRecorderWidth = chosen.width;
      viewerState.videoRecorderHeight = chosen.height;
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

          <FormControl fullWidth margin="dense" sx={{ marginTop: 2 }}>
            <InputLabel>Select Resolution</InputLabel>
            <Select
              value={selectedResolution}
              label="Select Resolution"
              onChange={(e) => handleResolutionChange(e.target.value)}
            >
              {resolutions.map((res) => (
                <MenuItem key={res.label} value={res.label}>
                  {res.label} ({res.width}×{res.height})
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
