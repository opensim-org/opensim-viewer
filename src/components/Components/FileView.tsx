import { observer } from 'mobx-react';
import DropFile from '../Components/DropFile'
import InputLabel from '@mui/material/InputLabel';
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useModelContext } from '../../state/ModelUIStateContext';

function FileView() {
  const { t } = useTranslation();
   const viewerState = useModelContext().viewerState;
   
    const downloadFile = () => {
      // Create a URL for the Blob
      const url = viewerState.currentModelPath;

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = url.split('/').pop()!;

      // Simulate a click on the anchor element to trigger the download
      a.click();

      // Release the object URL
      window.URL.revokeObjectURL(url);
    };

  return (
  <>
    <div style={{ marginBottom: '2em' }}>
        <InputLabel id="simple-select-standard-label">{t('fileView.importFile')}</InputLabel>
        <DropFile></DropFile>
    </div>
    <InputLabel id="simple-select-standard-label">{t('fileView.downloadGLTFFile')}</InputLabel>
    <Button
        variant="contained"
        color="primary"
        startIcon={<CloudDownloadIcon />}
        onClick={downloadFile}
      >
        {t('fileView.downloadGLTFFile')}
    </Button>
  </>
  );
}

export default observer(FileView);