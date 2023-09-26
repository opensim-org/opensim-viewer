import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import { Paper, Typography, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next'
import axios from 'axios';
import { getBackendURL } from '../../helpers/urlHelpers'
import viewerState from '../../state/ViewerState';
import { useNavigate, useLocation  } from 'react-router-dom';

const FileDropArea = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const appState = viewerState;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes:string[] = ['.osim', '.trc', '.mot', '.c3d', '.osimz']
  const acceptedTypesString:string = acceptedTypes.join(', ');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const store = useLocalObservable(() => ({
    files: [] as File[],
    uploadProgress: 0,
    uploadPercentage: 0,
    isUploadComplete: false,
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files) as File[];

      const filteredFiles = files.filter(file => {
        const fileExtension = `.${file.name.split('.').pop()}`;
        return acceptedTypes.includes(fileExtension.toLowerCase());
      });

      if (filteredFiles.length < files.length) {
        setErrorMessage(t('dropFile.unsuportedTypes', { count: files.length, file_formats: acceptedTypesString}) + "");
      } else {
        setErrorMessage('');
        store.files = filteredFiles;
        store.uploadFiles();
      }
    },
    onDragOver(e: React.DragEvent<HTMLDivElement>) {
      e.preventDefault();
    },
    onDragLeave(e: React.DragEvent<HTMLDivElement>) {
      e.preventDefault();
    },
    clearFiles(e: React.MouseEvent<HTMLButtonElement>) {
      e.stopPropagation();
      store.files = [];
      store.isUploadComplete = false;
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the input element's value
      }
      setErrorMessage('');
    },
    openFileSelector() {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    },
    handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(e.target.files as FileList);
      store.files = files;
      store.uploadFiles();
    },
    async uploadFiles() {
      if (store.files.length === 0) return;

      store.isUploadComplete = false;

      for (const file of store.files) {
        const formData = new FormData();
        formData.append('files', file);

        await axios.post(getBackendURL('upload_file/'), formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                "Authorization " : "Token "+localStorage.getItem('token')
              },
              onUploadProgress: progressEvent =>{
                const percent = progressEvent.loaded / progressEvent.total!
                store.uploadProgress = percent;
                store.uploadPercentage = percent;
              }
            }).then(response => {
              let url_gltf = getBackendURL(response.data.model_gltf_file);
              appState.setCurrentModelPath(url_gltf);

              if (location.pathname !== '/viewer')
                navigate('/viewer');
        
            })
      }
    }    
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px dashed gray',
        borderRadius: '4px',
        padding: '16px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
      onDrop={store.onDrop}
      onDragOver={store.onDragOver}
      onDragLeave={store.onDragLeave}
      onClick={store.openFileSelector}
    >
      <input
        type="file"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={store.handleFileChange}
        multiple
        accept={ acceptedTypesString }
      />
      {store.files.length === 0 ? (
        <Typography>{t('dropFile.dragAndDropMessage')}</Typography>
      ) : (
        <>
          {store.files.map((file, index) => (
            <Typography key={index}>{file.name}</Typography>
          ))}
          {store.isUploadComplete ? (
            <Typography>{t('dropFile.uploadCompleted', { count: store.files.length})}</Typography>
          ) : (
            <>
              <LinearProgress variant="determinate" value={store.uploadPercentage * 100} />
              <Typography>{t('dropFile.progress', { percentage: Math.round(store.uploadPercentage * 100)})}</Typography>
            </>
          )}
          <button onClick={store.clearFiles}>{t('dropFile.removeFiles', { count: store.files.length})}</button>
        </>
      )}
      {errorMessage && (
        <Typography variant="body2" color="error">
          {errorMessage}
        </Typography>
      )}
    </Paper>
  );
});

export default FileDropArea;

