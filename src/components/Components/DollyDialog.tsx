import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Stack, Typography, IconButton,
  Divider, Tooltip, Select, MenuItem, Chip,
} from '@mui/material';
import PlayArrowIcon  from '@mui/icons-material/PlayArrow';
import PauseIcon      from '@mui/icons-material/Pause';
import StopIcon       from '@mui/icons-material/Stop';
import AddIcon        from '@mui/icons-material/Add';
import DeleteIcon     from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { KeyframeTrack }     from './KeyframeTrack';
import { KeyframeEditor }    from './KeyframeEditor';
import { TimelineRuler }     from './TimelineRuler';
import { DollyFrame, DollyKeyframe, DollyTrack } from './dolly.types';
import { useDollyTimeline } from './useDollyTimeline';
import { newId } from './interpolate';

// ── Shared dark MUI sx overrides ──────────────────────────────────────────────
const dialogPaper = {
  bgcolor: '#1e2126',
  color: '#e2e6ed',
  borderRadius: '6px',
  border: '1px solid #2e3138',
};

interface Props {
  open:    boolean;
  dolly:   DollyTrack;
  onClose: () => void;
  /** Called when user clicks Save — receives the updated DollyTrack */
  onSave:  (updated: DollyTrack) => void;
  /**
   * Optional: called every frame while scrubbing/playing so the caller can
   * update its viewport camera in real time.
   */
  onFrame?: (frame: DollyFrame) => void;
}

// ── Timeline layout constants ─────────────────────────────────────────────────
const TRACK_HEIGHT   = 40;
const RULER_HEIGHT   = 22;
const TIMELINE_W_MIN = 400; // minimum track width in px

export function DollyDialog({ open, dolly, onClose, onSave, onFrame }: Props) {
  // ── Local working copy ───────────────────────────────────────────────────
  const [draft,       setDraft]       = useState<DollyTrack>(dolly);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [trackWidth,  setTrackWidth]  = useState(TIMELINE_W_MIN);
  const timelineRef   = useRef<HTMLDivElement>(null);

  // Reset draft when dolly prop changes (dialog re-opened with different dolly)
  useEffect(() => { setDraft(dolly); setSelectedId(null); }, [dolly]);

  // Measure the timeline container width responsively
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setTrackWidth(Math.max(TIMELINE_W_MIN, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // ── Playback hook ────────────────────────────────────────────────────────
  const { currentTime, isPlaying, scrubTo, play, pause, stop, setSpeed, speed, frame } =
    useDollyTimeline({
      keyframes: draft.keyframes,
      duration:  draft.duration,
      onFrame,
    });

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedKf = draft.keyframes.find(k => k.id === selectedId) ?? null;

  // ── Keyframe CRUD ────────────────────────────────────────────────────────
  const addKeyframe = useCallback(() => {
    const base = frame ?? {
      time: currentTime,
      position: [0, 1, 5] as [number,number,number],
      target:   [0, 0, 0] as [number,number,number],
      fov: 50, roll: 0,
    };
    // If a keyframe already exists within 10ms, don't duplicate
    const clash = draft.keyframes.some(k => Math.abs(k.time - currentTime) < 0.01);
    if (clash) return;
    const kf: DollyKeyframe = {
      id:       newId(),
      time:     currentTime,
      position: [...base.position] as [number,number,number],
      target:   [...base.target]   as [number,number,number],
      fov:      base.fov,
      roll:     base.roll,
      easing:   'ease-in-out',
    };
    const sorted = [...draft.keyframes, kf].sort((a, b) => a.time - b.time);
    setDraft(d => ({ ...d, keyframes: sorted }));
    setSelectedId(kf.id);
  }, [currentTime, draft.keyframes, frame]);

  const deleteKeyframe = useCallback((id: string) => {
    setDraft(d => ({ ...d, keyframes: d.keyframes.filter(k => k.id !== id) }));
    setSelectedId(prev => (prev === id ? null : prev));
  }, []);

  const duplicateKeyframe = useCallback((kf: DollyKeyframe) => {
    const offset = Math.min(0.2, draft.duration * 0.05);
    const clampedTime = Math.min(draft.duration, kf.time + offset);
    const newKf: DollyKeyframe = { ...kf, id: newId(), time: clampedTime };
    const sorted = [...draft.keyframes, newKf].sort((a, b) => a.time - b.time);
    setDraft(d => ({ ...d, keyframes: sorted }));
    setSelectedId(newKf.id);
    scrubTo(clampedTime);
  }, [draft.duration, draft.keyframes, scrubTo]);

  const updateKeyframe = useCallback((updated: DollyKeyframe) => {
    setDraft(d => ({
      ...d,
      keyframes: d.keyframes
        .map(k => k.id === updated.id ? updated : k)
        .sort((a, b) => a.time - b.time),
    }));
  }, []);

  const moveKeyframe = useCallback((id: string, newTime: number) => {
    setDraft(d => ({
      ...d,
      keyframes: d.keyframes
        .map(k => k.id === id ? { ...k, time: Math.round(newTime * 1000) / 1000 } : k)
        .sort((a, b) => a.time - b.time),
    }));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogPaper }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ borderBottom: '1px solid #2e3138', py: 1.5, px: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: '.02em' }}>
              Edit Dolly
            </Typography>
            <Chip
              label={draft.name}
              size="small"
              sx={{ bgcolor: '#2e3138', color: '#4a9eff', fontSize: 11, height: 20 }}
            />
            <Chip
              label={draft.captureMode}
              size="small"
              sx={{ bgcolor: 'rgba(0,212,160,.1)', color: '#00d4a0', fontSize: 10, height: 20 }}
            />
          </Stack>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#8b919e' }}>
            {draft.keyframes.length} keyframe{draft.keyframes.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{draft.duration.toFixed(2)}s
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Stack divider={<Divider sx={{ borderColor: '#2e3138' }} />}>

          {/* ── Transport controls ────────────────────────────────────── */}
          <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Play / Pause */}
            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <IconButton size="small" onClick={isPlaying ? pause : play}
                sx={{ color: '#4a9eff', bgcolor: 'rgba(74,158,255,.1)', borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(74,158,255,.2)' } }}>
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Stop */}
            <Tooltip title="Stop and rewind">
              <IconButton size="small" onClick={stop}
                sx={{ color: '#8b919e', '&:hover': { color: '#e2e6ed' } }}>
                <StopIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Time display */}
            <Box sx={{
              fontFamily: 'monospace', fontSize: 12,
              bgcolor: '#13151a', border: '1px solid #2e3138',
              borderRadius: 1, px: 1.25, py: 0.5,
              minWidth: 100, textAlign: 'center',
            }}>
              <span style={{ color: '#4a9eff' }}>{currentTime.toFixed(3)}</span>
              <span style={{ color: '#454a56' }}> / </span>
              <span style={{ color: '#8b919e' }}>{draft.duration.toFixed(2)}</span>
              <span style={{ color: '#454a56', fontSize: 10 }}> s</span>
            </Box>

            {/* Speed */}
            <Select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              size="small"
              sx={{
                fontSize: 11, color: '#8b919e', height: 28,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e3138' },
                '& .MuiSelect-select': { py: '4px', pl: '8px' },
              }}
            >
              {[0.1, 0.25, 0.5, 1, 2, 4].map(s => (
                <MenuItem key={s} value={s} sx={{ fontSize: 11 }}>{s}×</MenuItem>
              ))}
            </Select>

            <Box sx={{ flex: 1 }} />

            {/* Add keyframe at cursor */}
            <Tooltip title={`Add keyframe at ${currentTime.toFixed(3)}s`}>
              <span>
                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={addKeyframe}
                  disabled={draft.keyframes.some(k => Math.abs(k.time - currentTime) < 0.01)}
                  sx={{
                    fontSize: 11, color: '#4a9eff',
                    border: '1px solid rgba(74,158,255,.3)',
                    '&:hover': { bgcolor: 'rgba(74,158,255,.08)' },
                    '&:disabled': { opacity: 0.4 },
                  }}
                >
                  Add keyframe
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <Box sx={{ px: 2.5, py: 1.5 }} ref={timelineRef}>
            <Stack gap={0}>
              {/* Ruler */}
              <Box sx={{ pl: '72px' }}>
                <TimelineRuler
                  duration={draft.duration}
                  width={trackWidth - 72}
                  height={RULER_HEIGHT}
                />
              </Box>

              {/* Track label + keyframe track */}
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="caption"
                  sx={{ color: '#8b919e', width: 64, textAlign: 'right', flexShrink: 0, fontSize: 10 }}>
                  Camera
                </Typography>
                <KeyframeTrack
                  keyframes={draft.keyframes}
                  duration={draft.duration}
                  currentTime={currentTime}
                  width={trackWidth - 72}
                  height={TRACK_HEIGHT}
                  onScrub={scrubTo}
                  onKeyframeMove={moveKeyframe}
                  onKeyframeSelect={setSelectedId}
                  selectedId={selectedId}
                />
              </Stack>
            </Stack>

            {/* Legend */}
            <Stack direction="row" gap={2} mt={0.75} ml="72px">
              {([
                ['linear', '#4a9eff'],
                ['ease-in', '#f7b731'],
                ['ease-out', '#20bf6b'],
                ['ease-in-out', '#a55eea'],
                ['step', '#e05555'],
              ] as [string, string][]).map(([label, color]) => (
                <Stack key={label} direction="row" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '1px', bgcolor: color, transform: 'rotate(45deg)' }} />
                  <Typography variant="caption" sx={{ fontSize: 9, color: '#454a56' }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* ── Selected keyframe inspector ───────────────────────────── */}
          <Box sx={{ px: 2.5, py: 1.5, minHeight: 120 }}>
            {selectedKf ? (
              <Stack gap={1.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption"
                    sx={{ color: '#8b919e', textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 10 }}>
                    Keyframe &nbsp;
                    <span style={{ color: '#00d4a0', fontFamily: 'monospace' }}>
                      {selectedKf.time.toFixed(3)}s
                    </span>
                  </Typography>
                  <Stack direction="row" gap={0.5}>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => duplicateKeyframe(selectedKf)}
                        sx={{ color: '#8b919e', p: 0.5, '&:hover': { color: '#4a9eff' } }}>
                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete keyframe">
                      <IconButton size="small" onClick={() => deleteKeyframe(selectedKf.id)}
                        sx={{ color: '#8b919e', p: 0.5, '&:hover': { color: '#e05555' } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <KeyframeEditor keyframe={selectedKf} onChange={updateKeyframe} />
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                <Typography variant="caption" sx={{ color: '#454a56' }}>
                  Click a keyframe diamond to inspect and edit it
                </Typography>
              </Box>
            )}
          </Box>

          {/* ── Live interpolated readout ─────────────────────────────── */}
          {frame && (
            <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'rgba(255,255,255,.015)' }}>
              <Typography variant="caption"
                sx={{ color: '#454a56', textTransform: 'uppercase', letterSpacing: '.06em',
                      fontSize: 9, display: 'block', mb: 0.75 }}>
                Interpolated at cursor
              </Typography>
              <Stack direction="row" gap={3} flexWrap="wrap">
                {([
                  ['pos', frame.position.map(v => v.toFixed(2)).join(', ')],
                  ['tgt', frame.target.map(v => v.toFixed(2)).join(', ')],
                  ['fov', frame.fov.toFixed(1) + '°'],
                  ['roll', frame.roll.toFixed(1) + '°'],
                  ['seg', `${frame.segmentIndex}  (t=${(frame.segmentT * 100).toFixed(0)}%)`],
                ] as [string, string][]).map(([k, v]) => (
                  <Box key={k}>
                    <Typography variant="caption"
                      sx={{ color: '#454a56', display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {k}
                    </Typography>
                    <Typography variant="caption"
                      sx={{ fontFamily: 'monospace', color: '#8b919e', fontSize: 10 }}>
                      {v}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

        </Stack>
      </DialogContent>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <DialogActions sx={{ borderTop: '1px solid #2e3138', px: 2.5, py: 1.25, gap: 1 }}>
        <Button onClick={onClose} size="small"
          sx={{ color: '#8b919e', fontSize: 11,
                '&:hover': { color: '#e2e6ed', bgcolor: 'rgba(255,255,255,.05)' } }}>
          Cancel
        </Button>
        <Button
          onClick={() => { stop(); onSave(draft); }}
          size="small"
          variant="contained"
          sx={{
            fontSize: 11, bgcolor: '#4a9eff', px: 2,
            '&:hover': { bgcolor: '#3a8eef' },
            boxShadow: 'none',
          }}
        >
          Save dolly
        </Button>
      </DialogActions>
    </Dialog>
  );
}
