import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControlLabel,
  Checkbox,
  DialogActions,
  Button,
} from "@mui/material";


interface NodeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  updateNodeFn: ((node: any) => void) | null;
}

const NodeSettingsDialog: React.FC<NodeSettingsDialogProps> = ({
  open,
  onClose,
  selectedNode,
  setSelectedNode,
  updateNodeFn,
}) => {
  if (!selectedNode) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Node Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          value={selectedNode?.title || ""}
          onChange={(e) => {
            const updatedNode = { ...selectedNode, title: e.target.value };
            setSelectedNode(updatedNode);
            updateNodeFn?.(updatedNode);
          }}
          style={{ marginBottom: 16 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selectedNode?.visible ?? true}
              onChange={(e) => {
                const updatedNode = { ...selectedNode, visible: e.target.checked };
                if (updatedNode.object3D) updatedNode.object3D.visible = e.target.checked;
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
            />
          }
          label="Visible"
        />

        {selectedNode?.type === "SpotLight" && (
          <>
            <TextField
              label="Color"
              type="color"
              fullWidth
              value={selectedNode.color || "#ffffff"}
              onChange={(e) => {
                const color = e.target.value;
                const updatedNode = { ...selectedNode, color };
                if (updatedNode.object3D?.color?.set) updatedNode.object3D.color.set(color);
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
              style={{ marginTop: 16 }}
            />

            <TextField
              label="Angle"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: Math.PI }}
              value={selectedNode.angle ?? Math.PI / 3}
              onChange={(e) => {
                const angle = parseFloat(e.target.value);
                const updatedNode = { ...selectedNode, angle };
                if (updatedNode.object3D) updatedNode.object3D.angle = angle;
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
              style={{ marginTop: 16 }}
            />

            <TextField
              label="Distance"
              type="number"
              fullWidth
              value={selectedNode.distance ?? 5}
              onChange={(e) => {
                const distance = parseFloat(e.target.value);
                const updatedNode = { ...selectedNode, distance };
                if (updatedNode.object3D) updatedNode.object3D.distance = distance;
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
              style={{ marginTop: 16 }}
            />

            <TextField
              label="Penumbra"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 1, step: 0.01 }}
              value={selectedNode.penumbra ?? 0.6}
              onChange={(e) => {
                const penumbra = parseFloat(e.target.value);
                const updatedNode = { ...selectedNode, penumbra };
                if (updatedNode.object3D) updatedNode.object3D.penumbra = penumbra;
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
              style={{ marginTop: 16 }}
            />
          </>
        )}

        {selectedNode?.type === "DirectionalLight" && (
          <>
            <TextField
              label="Intensity"
              type="number"
              fullWidth
              value={selectedNode.intensity ?? 0.25}
              onChange={(e) => {
                const intensity = parseFloat(e.target.value);
                const updatedNode = { ...selectedNode, intensity };
                if (updatedNode.object3D) updatedNode.object3D.intensity = intensity;
                setSelectedNode(updatedNode);
                updateNodeFn?.(updatedNode);
              }}
              style={{ marginTop: 16 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedNode.castShadow ?? true}
                  onChange={(e) => {
                    const castShadow = e.target.checked;
                    const updatedNode = { ...selectedNode, castShadow };
                    if (updatedNode.object3D) updatedNode.object3D.castShadow = castShadow;
                    setSelectedNode(updatedNode);
                    updateNodeFn?.(updatedNode);
                  }}
                />
              }
              label="Cast Shadow"
              style={{ marginTop: 16 }}
            />
          </>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeSettingsDialog;
