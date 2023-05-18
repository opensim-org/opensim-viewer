import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import { Paper, Typography, LinearProgress } from '@mui/material';

const FileDropArea = observer(() => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes:string[] = ['.gltf']
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
        setErrorMessage('One or more files have unsupported types. Accepted file types are: ' + acceptedTypesString);
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
    
        const xhr = new XMLHttpRequest();
    
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            const percentage = percent / 100; // Convert to decimal value
            store.uploadProgress = percent;
            store.uploadPercentage = percentage;
          }
        });
    
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            // Handle completed upload for this file
            if (store.files.length === 1) {
              // Check if this was the last file being uploaded
              store.isUploadComplete = true;
              store.uploadProgress = 0;
              store.uploadPercentage = 0;
            }
          }
        };
    
        xhr.open('POST', '/upload');
        xhr.send(formData);
      }
    },
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
        <Typography>Drag and drop files here or click to select files</Typography>
      ) : (
        <>
          {store.files.map((file, index) => (
            <Typography key={index}>{file.name}</Typography>
          ))}
          {store.isUploadComplete ? (
            <Typography>Upload Completed</Typography>
          ) : (
            <>
              <LinearProgress variant="determinate" value={store.uploadPercentage * 100} />
              <Typography>{Math.round(store.uploadPercentage * 100)}% Uploaded</Typography>
            </>
          )}
          <button onClick={store.clearFiles}>Remove Files</button>
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

