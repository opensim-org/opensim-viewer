import React, { useState, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Paper, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next'
import { useSnackbar } from 'notistack';
import { useModelContext } from '../../state/ModelUIStateContext';
import { Storage } from "@aws-amplify/storage";
import * as AWS from 'aws-sdk';
import { useNavigate, useLocation } from 'react-router-dom';

interface DropFileFullPageProps {
  children: React.ReactNode;
  acceptedTypes?: string[];
}

const DropFileFullPage: React.FC<DropFileFullPageProps> = observer(({
  children,
  acceptedTypes = ['.osim', '.trc', '.mot', '.c3d', '.osimz', '.gltf']
}) => {
  const { t } = useTranslation();
  const viewerState = useModelContext().viewerState;
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const acceptedTypesString = acceptedTypes.join(', ');

  // Check if there's already a model loaded
  const hasModelLoaded = viewerState.currentModelPath && viewerState.currentModelPath !== '';

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage('');

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;

    // Filter files by accepted types
    const filteredFiles = files.filter(file => {
      const fileExtension = `.${file.name.split('.').pop()}`;
      return acceptedTypes.includes(fileExtension.toLowerCase());
    });

    if (filteredFiles.length === 0) {
      setErrorMessage(t('dropFile.unsuportedTypes', { count: files.length, file_formats: acceptedTypesString}) + "");
      return;
    }

    // Process only the first valid file (or handle multiple as needed)
    const file = filteredFiles[0];
    setIsProcessing(true);

    try {
      await processFile(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setErrorMessage(t('dropFile.uploadError') + "");
    } finally {
      setIsProcessing(false);
    }
  }, [acceptedTypes, acceptedTypesString, t]);

  const processFile = useCallback(async (file: File) => {
    enqueueSnackbar(t('dropFile.uploading_files'), {
      variant: 'info',
      anchorOrigin: { horizontal: "right", vertical: "bottom" },
      persist: true
    });

    let url_gltf = "";
    if (file.name.endsWith(".gltf")) {
      // Handle GLTF file locally
      url_gltf = URL.createObjectURL(file);
      viewerState.setCurrentModelPath(url_gltf);
      closeSnackbar();

      if (location.pathname !== '/viewer') {
        navigate('/viewer');
      }

      viewerState.isLocalUpload = true;
      return;
    }

    // Handle other file types through S3
    try {
      await Storage.put(file.name, file);

      let user_uuid = viewerState.user_uuid;
      const params: AWS.Lambda.InvocationRequest = {
        FunctionName: 'opensim-viewer-func',
        Payload: JSON.stringify({
          s3: 'opensimviewer-input-bucket101047-dev',
          key: 'public/' + file.name,
          user_uuid: user_uuid
        })
      };

      const lambda = new AWS.Lambda({
        region: 'us-west-2',
      });

      await new Promise((resolve, reject) => {
        lambda.invoke(params, (err: any, data: any) => {
          if (err) {
            reject(err);
          } else {
            console.log('Lambda function invoked successfully:', data);
            resolve(data);
          }
        });
      });

      closeSnackbar();
      viewerState.isLocalUpload = false;

      // Navigate to viewer if not already there
      if (location.pathname !== '/viewer') {
        navigate('/viewer');
      }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }, [viewerState, closeSnackbar, enqueueSnackbar, t, navigate, location]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasModelLoaded && !isProcessing) {
      setIsDragging(true);
    }
  }, [hasModelLoaded, isProcessing]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Clean up any resources when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <Box component="div"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {children}

      {/* Overlay shown when dragging or when no model is loaded */}
      {!hasModelLoaded && !isProcessing && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
            border: isDragging ? '4px dashed #ffffff' : '4px dashed transparent',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            zIndex: 9999,
            pointerEvents: isDragging ? 'auto' : 'none',
          }}
        >
          {isDragging && (
            <>
              <Typography
                variant="h3"
                color="white"
                sx={{
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  mb: 2,
                  textAlign: 'center',
                  px: 4
                }}
              >
                {t('dropFile.dropFilesHere') || 'Drop your files here'}
              </Typography>
              <Typography
                variant="h6"
                color="rgba(255,255,255,0.8)"
                sx={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  textAlign: 'center',
                  px: 4
                }}
              >
                {t('dropFile.acceptedFormats', { formats: acceptedTypesString }) ||
                 `Accepted formats: ${acceptedTypesString}`}
              </Typography>
              {errorMessage && (
                <Typography
                  variant="body1"
                  color="error"
                  sx={{
                    mt: 2,
                    backgroundColor: 'rgba(255,0,0,0.1)',
                    padding: '8px 16px',
                    borderRadius: '4px'
                  }}
                >
                  {errorMessage}
                </Typography>
              )}
            </>
          )}
        </Paper>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
          }}
        >
          <Typography variant="h5" color="white" sx={{ mb: 2 }}>
            {t('dropFile.processingFile') || 'Processing file...'}
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.8)">
            {t('dropFile.pleaseWait') || 'Please wait...'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
});

export default DropFileFullPage;