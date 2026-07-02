import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

interface PromptOptions {
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export function usePrompt() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({ title: '' });
  const [value, setValue] = useState('');
  const resolveRef = useRef<(value: string | null) => void>();

  const prompt = useCallback((opts: PromptOptions): Promise<string | null> => {
    setOptions(opts);
    setValue(opts.defaultValue ?? '');
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(value);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(null);
  };

  const PromptDialog = (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="xs">
      <DialogTitle>{options.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          variant="standard"
          label={options.label}
          placeholder={options.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{options.cancelText ?? 'Cancel'}</Button>
        <Button onClick={handleConfirm} variant="contained">
          {options.confirmText ?? 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { prompt, PromptDialog };
}