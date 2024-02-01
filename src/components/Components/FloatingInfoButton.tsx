import React, { useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next'
import './FloatingInfoButton.css';
import { ModelInfo } from '../../state/ModelUIState';

const FloatingButton = (info: ModelInfo) => {
  const { t } = useTranslation();
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const handleButtonClick = () => {
    setIsWindowOpen(!isWindowOpen);
  };

  return (
    <div className="floating-button-container">

      <Tooltip title={t('floatingButton.model_info')}>
          <IconButton
            color="primary"
            className="floating-button"
            onClick={handleButtonClick}>
              <InfoIcon />
          </IconButton>
      </Tooltip>
      {isWindowOpen &&
        <div className="floating-window">
        {info.model_name}
        <br></br>
        Description: {info.desc}
        <br></br>
        Authors: {info.authors}
        </div>
        
      }
    </div>
  );
};

export default FloatingButton;
