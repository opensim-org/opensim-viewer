import React, { useEffect, useRef } from 'react';
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import { observer } from "mobx-react";
import { MyModelContext } from "../../state/ModelUIStateContext";
import { useModelContext } from "../../state/ModelUIStateContext";

interface RecordModeOverlayProps {
  videoRecorderRef: React.RefObject<any>;
  onRecordComplete?: () => void;
}

const OverlayContainer = styled(Box)({
  position: 'absolute',
  bottom: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: '12px 24px',
  borderRadius: '40px',
  backdropFilter: 'blur(8px)',
  zIndex: 9999, // Increased z-index to ensure it appears above everything
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
});

const StyledButton = styled(Button)({
  minWidth: '100px',
  fontWeight: 'bold',
  '&.record-button': {
    backgroundColor: '#ff4444',
    color: 'white',
    '&:hover': {
      backgroundColor: '#cc0000',
    },
  },
  '&.cancel-button': {
    backgroundColor: '#666666',
    color: 'white',
    '&:hover': {
      backgroundColor: '#444444',
    },
  },
});

const InfoButton = styled(IconButton)({
  color: 'white',
  backgroundColor: 'rgba(255,255,255,0.2)',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

const RecordModeOverlay: React.FC<RecordModeOverlayProps> = ({ videoRecorderRef, onRecordComplete }) => {
  const uiState = useModelContext();
  const [originalShowGuides, setOriginalShowGuides] = React.useState<boolean | undefined>(undefined);
  const [infoTooltipOpen, setInfoTooltipOpen] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);

  // Save original state when entering record mode and restore when exiting
  useEffect(() => {

    if (uiState.isInRecordMode) {
      // Store the original value before changing it
      const currentGuideState = uiState.viewerState.showAspectRatioGuides;
      console.log("Saving original guides state:", currentGuideState);
      setOriginalShowGuides(currentGuideState);

      // Set showAspectRatioGuides to true
      if (uiState.viewerState.setShowAspectRatioGuides) {
        console.log("Setting showAspectRatioGuides to true");
        uiState.viewerState.setShowAspectRatioGuides(true);
      }
    } else if (originalShowGuides !== undefined) {
      // Restore when exiting record mode
      console.log("Restoring original guides state:", originalShowGuides);
      if (uiState.viewerState.setShowAspectRatioGuides) {
        uiState.viewerState.setShowAspectRatioGuides(originalShowGuides);
      }
      // Reset originalShowGuides to avoid restoring again
      setOriginalShowGuides(undefined);
    }
  }, [uiState.isInRecordMode, uiState.viewerState, originalShowGuides]);

  const handleRecordClick = async () => {
    if (isRecording) {
      console.log("Already recording, ignoring click");
      return;
    }

    console.log("Starting recording process...");
    setIsRecording(true);

    try {
      // Start the recording
      console.log("Calling startAnimationRecording");
      uiState.startAnimationRecording();

      if (videoRecorderRef?.current && !uiState.viewerState.isRecordingVideo) {
        console.log("Starting video recorder");
        videoRecorderRef.current.startRecording();
      } else {
        console.log("Video recorder not available or already recording");
      }

      // Wait a moment for recording to start properly
      await new Promise(resolve => setTimeout(resolve, 100));

      // Exit record mode - this will trigger the useEffect cleanup to restore guides
      console.log("Exiting record mode");
      uiState.setIsInRecordMode(false);

      // Call the optional completion callback
      onRecordComplete?.();
      console.log("Recording process completed successfully");
    } catch (error) {
      console.error("Error during recording:", error);
      // Make sure to exit record mode even if there's an error
      uiState.setIsInRecordMode(false);
    } finally {
      setIsRecording(false);
    }
  };

  const handleCancelClick = () => {
    console.log("Cancelling record mode");
    // Simply exit record mode - useEffect will handle restoration
    uiState.setIsInRecordMode(false);
  };

  const handleInfoClick = () => {
    setInfoTooltipOpen(!infoTooltipOpen);
  };

  console.log("Rendering RecordModeOverlay - isRecording:", isRecording);

  return (
    <OverlayContainer>
      <InfoButton
        size="small"
        onClick={handleInfoClick}
      >
        <Tooltip
          title="Please, center your model in the highlighted recording area and preview the video by playing your animation. Then click Record to export your video."
          open={infoTooltipOpen}
          onOpen={() => setInfoTooltipOpen(true)}
          onClose={() => setInfoTooltipOpen(false)}
          placement="top"
          arrow
          PopperProps={{
            sx: {
              '& .MuiTooltip-tooltip': {
                backgroundColor: 'rgba(0,0,0,0.9)',
                fontSize: '0.875rem',
                maxWidth: '300px',
                textAlign: 'center',
                padding: '12px',
              },
            },
          }}
        >
          <InfoIcon />
        </Tooltip>
      </InfoButton>

      <StyledButton
        className="record-button"
        variant="contained"
        onClick={handleRecordClick}
        disabled={isRecording}
      >
        {isRecording ? "Recording..." : "Record"}
      </StyledButton>

      <StyledButton
        className="cancel-button"
        variant="contained"
        onClick={handleCancelClick}
        disabled={isRecording}
      >
        Cancel
      </StyledButton>
    </OverlayContainer>
  );
};

export default observer(RecordModeOverlay);