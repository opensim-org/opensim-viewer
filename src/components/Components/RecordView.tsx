import React from 'react';
import { observer } from 'mobx-react';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';

import { useModelContext } from '../../state/ModelUIStateContext';

function RecordView() {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;

  const handleVideoFormatChange = (event:any) => {
    viewerState.setRecordedVideoFormat(event.target.value)
  };

  const handleImageFormatChange = (event:any) => {
    viewerState.setSnapshotFormat(event.target.value)
  };

  const handleVideoNameChange = (event:any) => {
    viewerState.setRecordedVideoName(event.target.value)
  };

  const handleImageNameChange = (event:any) => {
    viewerState.setSnapshotName(event.target.value)
  };

  return (
    <>
      <FormControl fullWidth size="small" margin="normal" >
        <InputLabel id="output_format_video">{t('recordView.output_format_video')}</InputLabel>
        <Select
          labelId="output_format_video"
          label={t('recordView.output_format_video')}
          value={viewerState.recordedVideoFormat}
          onChange={handleVideoFormatChange}
        >
          <MenuItem value="mp4">MP4</MenuItem>
          <MenuItem value="mov">MOV</MenuItem>
          <MenuItem value="webm">WEBM</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" margin="normal">
        <InputLabel id="output_format_image">{t('recordView.output_format_image')}</InputLabel>
        <Select
          labelId="output_format_image"
          label={t('recordView.output_format_image')}
          value={viewerState.snapshotFormat}
          onChange={handleImageFormatChange}
        >
          <MenuItem value="png">PNG</MenuItem>
        </Select>
      </FormControl>

      <TextField
        size="small"
        label={t('recordView.video_name_label')}
        value={viewerState.recordedVideoName}
        onChange={handleVideoNameChange}
        fullWidth
        margin="normal"
      />

      <TextField
        size="small"
        label={t('recordView.image_name_label')}
        value={viewerState.snapshotName}
        onChange={handleImageNameChange}
        fullWidth
        margin="normal"
      />
    </>
  );
}

export default observer(RecordView);
