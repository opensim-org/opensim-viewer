import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import { Paper, Typography, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next'
import viewerState from '../../state/ViewerState';
import { useNavigate, useLocation  } from 'react-router-dom';
import { Storage } from "@aws-amplify/storage"
import * as AWS from 'aws-sdk';
import { useSnackbar } from 'notistack'


AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID, // replace with own credentials to test
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY_ID,
  region: 'us-west-2' // replace with your region
});

const lambda = new AWS.Lambda({
  region: 'us-west-2', // replace with your region
});

interface FileDropAreaProps {
  paddingY?: number;
}

const FileDropArea: React.FC<FileDropAreaProps> =observer(({ paddingY = 16}) => {
  const { t } = useTranslation();
  //const navigate = useNavigate();
  //const location = useLocation();
  const appState = viewerState;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar, closeSnackbar  } = useSnackbar();

  const acceptedTypes:string[] = ['.osim', '.trc', '.mot', '.c3d', '.osimz', '.gltf']
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
      closeSnackbar()
      const files = Array.from(e.target.files as FileList);
      store.files = files;
      store.uploadFiles();
    },
    async uploadFiles() {
      enqueueSnackbar(t('dropFile.uploading_files'), {variant: 'info', anchorOrigin: { horizontal: "right", vertical: "bottom"}, persist: true})
      if (store.files.length === 0) return;

      store.isUploadComplete = false;

      for (const file of store.files) {
        const formData = new FormData();
        formData.append('files', file);

        let url_gltf = ""
        if (file.name.endsWith(".gltf")) {
            url_gltf = URL.createObjectURL(file);
            appState.setCurrentModelPath(url_gltf);
            closeSnackbar()

            // if (location.pathname !== '/viewer') {
            //     navigate('/viewer');
            // }

            store.uploadProgress = 1;
            store.uploadPercentage = 1;

            // File uploaded to local.
            viewerState.isLocalUpload = true
        } else {
            Storage.put(file.name, file).then(()=>{

              let user_uuid = viewerState.user_uuid;

              const params: AWS.Lambda.InvocationRequest = {
                FunctionName: 'opensim-viewer-func', // replace with your Lambda function's name
                Payload: JSON.stringify({
                    s3: 'opensimviewer-input-bucket101047-dev',
                    key: 'public/' + file.name,
                    user_uuid: user_uuid
                })
              };
              lambda.invoke(params, (err: any, data: any) => {
                    if (err) {
                        console.error(err);
                    } else {
                      const key = file.name.replace(/\.\w+$/, '.gltf')
                      const gltf_url = "https://s3.us-west-2.amazonaws.com/opensim-viewer-public-download/" + user_uuid + "/"+key
                      /* appState.setCurrentModelPath(gltf_url); */
                      // navigate("/viewer/"+encodeURIComponent(gltf_url))
                      console.log('Lambda function invoked successfully:', data);
                      closeSnackbar()
                    }
                });
                // if (location.pathname !== '/viewer')
                //     navigate('/viewer');

                // File uploaded to S3, so it is not a local upload.
                viewerState.isLocalUpload = true
              })
              .catch(error => {
                  console.error('Error:', error);
              });
          }
        }
    }    
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px dashed gray',
        borderRadius: '4px',
        padding: `${paddingY}px`,
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

