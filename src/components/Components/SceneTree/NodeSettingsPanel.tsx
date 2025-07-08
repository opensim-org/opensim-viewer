import React from "react";
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";

interface NodeSettingsPanelProps {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  updateNodeFn: ((node: any) => void) | null;
}

const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({
  selectedNode,
  setSelectedNode,
  updateNodeFn,
}) => {
  if (!selectedNode) {
    return (
      <div style={{ padding: 16, color: "#999", fontStyle: "italic" }}>
        Select a node to edit its settings…
      </div>
    );
  }

  const patch = (patchObj: Record<string, any>) => {
    const updatedNode = { ...selectedNode, ...patchObj };
    if (patchObj.object3DProps && updatedNode.object3D) {
      Object.assign(updatedNode.object3D, patchObj.object3DProps);
    }
    setSelectedNode(updatedNode);
    updateNodeFn?.(updatedNode);
  };

  /** after editing any camera param we need to refresh the projection */
  const refreshCamera = () => {
    if (selectedNode.object3D?.updateProjectionMatrix) {
      selectedNode.object3D.updateProjectionMatrix();
    }
  };

  return (
    <div
      style={{
        borderTop: "1px solid #ddd",
        padding: 16,
        maxHeight: "40vh",
        overflowY: "auto",
      }}
    >
      <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
        {selectedNode.type ?? "Node"} settings
      </Typography>

      <TextField
        label="Name"
        fullWidth
        value={selectedNode.title ?? selectedNode.object3D?.name ?? ""}
        onChange={(e) => patch({ title: e.target.value })}
        style={{ marginBottom: 16 }}
      />

      {selectedNode?.type === "SpotLight" && (
        <>
          <TextField
            label="Color"
            type="color"
            fullWidth
            value={selectedNode.color ?? selectedNode.object3D?.color?.getStyle?.() ?? "#ffffff"}
            onChange={(e) =>
              patch({
                color: e.target.value,
                object3DProps: { color: { set: e.target.value } },
              })
            }
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Angle (rad)"
            type="number"
            fullWidth
            inputProps={{ min: 0, max: Math.PI, step: 0.01 }}
            value={selectedNode.angle ?? selectedNode.object3D?.angle ?? Math.PI / 6}
            onChange={(e) =>
              patch({
                angle: parseFloat(e.target.value),
                object3DProps: { angle: parseFloat(e.target.value) },
              })
            }
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Distance"
            type="number"
            fullWidth
            value={selectedNode.distance ?? selectedNode.object3D?.distance ?? 5}
            onChange={(e) =>
              patch({
                distance: parseFloat(e.target.value),
                object3DProps: { distance: parseFloat(e.target.value) },
              })
            }
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Penumbra"
            type="number"
            fullWidth
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            value={selectedNode.penumbra ?? selectedNode.object3D?.penumbra ?? 0.6}
            onChange={(e) =>
              patch({
                penumbra: parseFloat(e.target.value),
                object3DProps: { penumbra: parseFloat(e.target.value) },
              })
            }
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
            value={selectedNode.intensity ?? selectedNode.object3D?.intensity ?? 0.25}
            onChange={(e) =>
              patch({
                intensity: parseFloat(e.target.value),
                object3DProps: { intensity: parseFloat(e.target.value) },
              })
            }
            style={{ marginTop: 16 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedNode.castShadow ?? selectedNode.object3D?.castShadow ?? true}
                onChange={(e) =>
                  patch({
                    castShadow: e.target.checked,
                    object3DProps: { castShadow: e.target.checked },
                  })
                }
              />
            }
            label="Cast Shadow"
            style={{ marginTop: 16 }}
          />
        </>
      )}

      {selectedNode?.type === "PerspectiveCamera" && (
        <>
          <TextField
            label="Field of view (°)"
            type="number"
            fullWidth
            inputProps={{ min: 1, max: 179, step: 1 }}
            value={selectedNode.fov ?? selectedNode.object3D?.fov ?? 50}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                fov: v,
                object3DProps: { fov: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Near plane"
            type="number"
            fullWidth
            value={selectedNode.near ?? selectedNode.object3D?.near ?? 0.1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                near: v,
                object3DProps: { near: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Far plane"
            type="number"
            fullWidth
            value={selectedNode.far ?? selectedNode.object3D?.far ?? 100}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                far: v,
                object3DProps: { far: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
        </>
      )}

      {selectedNode?.type === "OrthographicCamera" && (
        <>
          <TextField
            label="Left"
            type="number"
            fullWidth
            value={selectedNode.left ?? selectedNode.object3D?.left ?? -1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                left: v,
                object3DProps: { left: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Right"
            type="number"
            fullWidth
            value={selectedNode.right ?? selectedNode.object3D?.right ?? 1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                right: v,
                object3DProps: { right: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Top"
            type="number"
            fullWidth
            value={selectedNode.top ?? selectedNode.object3D?.top ?? 1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                top: v,
                object3DProps: { top: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Bottom"
            type="number"
            fullWidth
            value={selectedNode.bottom ?? selectedNode.object3D?.bottom ?? -1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                bottom: v,
                object3DProps: { bottom: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Near plane"
            type="number"
            fullWidth
            value={selectedNode.near ?? selectedNode.object3D?.near ?? 0.1}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                near: v,
                object3DProps: { near: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
          <TextField
            label="Far plane"
            type="number"
            fullWidth
            value={selectedNode.far ?? selectedNode.object3D?.far ?? 50}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              patch({
                far: v,
                object3DProps: { far: v },
              });
              refreshCamera();
            }}
            style={{ marginTop: 16 }}
          />
        </>
      )}

    </div>


  );
};

export default NodeSettingsPanel;
