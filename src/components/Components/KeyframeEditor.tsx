import React from 'react';
import {
  Box, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Typography,
} from '@mui/material';
import { DollyKeyframe, EasingType } from './dolly.types';

const EASINGS: EasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'step'];

const fieldSx = {
  '& .MuiInputBase-input': { fontSize: 11, py: '5px', px: '8px', fontFamily: 'monospace' },
  '& .MuiInputLabel-root': { fontSize: 11 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e3138' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4a9eff44' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4a9eff' },
};

interface Vec3FieldProps {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}

function Vec3Field({ label, value, onChange }: Vec3FieldProps) {
  const axes = ['X', 'Y', 'Z'] as const;
  return (
    <Box component="div">
      <Typography variant="caption" sx={{ color: '#8b919e', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 10 }}>
        {label}
      </Typography>
      <Box component="div" sx={{ display: 'flex', gap: 0.75 }}>
        {axes.map((axis, i) => (
          <TextField
            key={axis}
            label={axis}
            type="number"
            size="small"
            value={value[i]}
            onChange={e => {
              const next = [...value] as [number, number, number];
              next[i] = parseFloat(e.target.value) || 0;
              onChange(next);
            }}
            inputProps={{ step: 0.01 }}
            sx={{ ...fieldSx, flex: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
}

interface Props {
  keyframe: DollyKeyframe;
  onChange: (updated: DollyKeyframe) => void;
}

export function KeyframeEditor({ keyframe, onChange }: Props) {
  const set = <K extends keyof DollyKeyframe>(key: K, value: DollyKeyframe[K]) =>
    onChange({ ...keyframe, [key]: value });

  return (
    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Grid container spacing={1}>
        {/* Time */}
        <Grid item xs={4}>
          <TextField
            label="Time (s)"
            type="number"
            size="small"
            value={keyframe.time}
            onChange={e => set('time', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.01, min: 0 }}
            sx={fieldSx}
            fullWidth
          />
        </Grid>

        {/* FoV */}
        <Grid item xs={4}>
          <TextField
            label="FoV (°)"
            type="number"
            size="small"
            value={keyframe.fov}
            onChange={e => set('fov', parseFloat(e.target.value) || 50)}
            inputProps={{ step: 1, min: 5, max: 160 }}
            sx={fieldSx}
            fullWidth
          />
        </Grid>

        {/* Roll */}
        <Grid item xs={4}>
          <TextField
            label="Roll (°)"
            type="number"
            size="small"
            value={keyframe.roll}
            onChange={e => set('roll', parseFloat(e.target.value) || 0)}
            inputProps={{ step: 0.5 }}
            sx={fieldSx}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* Position */}
      <Vec3Field
        label="Position"
        value={keyframe.position}
        onChange={v => set('position', v)}
      />

      {/* Target */}
      <Vec3Field
        label="Look target"
        value={keyframe.target}
        onChange={v => set('target', v)}
      />

      {/* Easing */}
      <FormControl size="small" sx={{ ...fieldSx, width: 160 }}>
        <InputLabel sx={{ fontSize: 11 }}>Easing to next</InputLabel>
        <Select
          label="Easing to next"
          value={keyframe.easing}
          onChange={e => set('easing', e.target.value as EasingType)}
          sx={{ fontSize: 11 }}
        >
          {EASINGS.map(e => (
            <MenuItem key={e} value={e} sx={{ fontSize: 11 }}>{e}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
