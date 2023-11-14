import { Button, FormControl, IconButton, Modal, TextField } from '@mui/material';
import React from 'react';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';

const ShareModal: React.FC<{ message: string }> = ({message}) => {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button type="button" onClick={handleOpen}>
        Share with a link
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Sharing Link"
      >
        <div style={{ marginTop: '20em', marginLeft: '5em' }}>
        <FormControl variant="standard">
        <TextField
          id="url"
          label="URL"
          defaultValue={message}
          InputProps={{
            readOnly: true,
          }}
        />
      </FormControl>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseTwoToneIcon />
          </IconButton>
        </div>
      </Modal>
    </div>
  );
}

export default ShareModal;
