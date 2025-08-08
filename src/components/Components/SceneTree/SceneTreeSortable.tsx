import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';

import SortableTree, { changeNodeAtPath } from '@nosferatu500/react-sortable-tree';
import FileExplorerTheme from '@nosferatu500/theme-file-explorer';
import '@nosferatu500/react-sortable-tree/style.css';

import {  Menu, MenuItem, Dialog, DialogTitle, DialogActions, Button, IconButton, useTheme, Theme, alpha } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AddIcon from '@mui/icons-material/Add';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import PublicIcon from '@mui/icons-material/Public';
import GridOnIcon from '@mui/icons-material/GridOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PanoramaIcon from '@mui/icons-material/Panorama';

import { convertSceneToTree } from '../../../helpers/sceneToTree';
import { useModelContext } from '../../../state/ModelUIStateContext';
import { ModelUIState } from '../../../state/ModelUIState';

import NodeSettingsPanel from "./NodeSettingsPanel";

import './SceneTreeSortable.css';

const PANEL_WIDTH = 300;

interface SceneTreeSortableProps {
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  height: string;
  sceneVersion?: number;
  onAddCameraClick?: (node: any) => void;
  onAddLightClick?: (node: any) => void;
  setTransformTargetFunction?: (func: any) => void;
  onWidthChange?: (w: number) => void;
}

export interface SceneTreeSortableHandle {
  getWidth: () => number;
  open: () => void;
  close: () => void;
  selectedNode: () => any;
}

const iconMap: Record<string, JSX.Element> = {
  scene: <PanoramaIcon />,
  model: <PersonIcon />,
  group: <FolderIcon />,
  camera: <CameraAltIcon />,
  light: <LightbulbIcon />,
  axes: <ThreeDRotationIcon />,
  skySphere: <PublicIcon />,
  floor: <GridOnIcon />,
  body: <PersonIcon />,
  unknown: <HelpOutlineIcon />,
  addCameraButton: <> </>,
  addLightButton: <> </>,
};

function applyTreeToScene(tree: any[], scene: THREE.Scene) {
  const applyNode = (node: any, parent: THREE.Object3D) => {
    const object = node.object3D;
    if (!object) return;

    if (object.parent && object.parent !== parent) object.parent.remove(object);
    if (object.parent !== parent) parent.add(object);

    node.children?.forEach((child: any) => applyNode(child, object));
  };

  tree.forEach((node) => applyNode(node, scene));
}

export const SceneTreeSortable = forwardRef<SceneTreeSortableHandle, SceneTreeSortableProps>(
  ({
      scene,
      camera,
      height,
      sceneVersion,
      onAddCameraClick,
      onAddLightClick,
      setTransformTargetFunction,
      onWidthChange,
    },
    ref
  ) => {
    const theme = useTheme<Theme>();
    const uiState = useModelContext();

    const [treeData, setTreeData] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [selectedPath, setSelectedPath] = useState<number[] | null>(null);
    const [settingsNode, setSettingsNode] = useState<any>(null);
    const [updateNodeFn, setUpdateNodeFn] = useState<((n: any) => void) | null>(null);

    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; node: any; path: number[] } | null>(null);
    const [nodeToDelete, setNodeToDelete] = useState<{ node: any; path: number[] } | null>(null);

    const outerDivRef = useRef<HTMLDivElement>(null);

    const typesExcludedFromRemove = ['skySphere', 'floor', 'axes', 'group', 'model'];


    useImperativeHandle(ref, () => ({
      getWidth: () => (isOpen ? PANEL_WIDTH : 0),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      selectedNode: () => settingsNode,
    }), [isOpen, settingsNode]);

    useEffect(() => {
      onWidthChange?.(isOpen ? PANEL_WIDTH : 0);
    }, [isOpen]);

    useEffect(() => {
      if (scene && camera) {
        setTreeData(convertSceneToTree(scene));
      }
    }, [scene, camera, sceneVersion]);

    const handleSettingsClick = (node: any, path: number[]) => {
      setSettingsNode(node);

      const updateNode = (updatedNode: any) => {
        const newTree = changeNodeAtPath({
          treeData,
          path,
          getNodeKey: ({ treeIndex }) => treeIndex,
          newNode: updatedNode,
        });
        setTreeData(newTree);
        setSettingsNode(updatedNode);
      };

      setUpdateNodeFn(() => updateNode);
    };

    const handleVisibilityToggle = (node: any) => {
      node.object3D.visible = !node.object3D.visible;
      setTreeData([...treeData]);
    };

    const panelBg = alpha(theme.palette.background.paper, 0.9);

    return (
      <div
        ref={outerDivRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* Sliding Panel */}
        <div
          style={{
            width: isOpen ? PANEL_WIDTH : 0,
            overflow: 'hidden',
            height,
            backgroundColor: panelBg,
            padding: isOpen ? theme.spacing(1) : 0,
            transition: 'width 0.3s ease, padding 0.3s ease',
            boxShadow: isOpen ? (theme.shadows[4] as string) : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close Button */}
          {isOpen && (
            <IconButton
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                left: '-20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: panelBg,
                borderRadius: '50%',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          )}

          {/* Tree View + Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <SortableTree
                treeData={treeData}
                onChange={(newData) => {
                  setTreeData(newData);
                  if (scene) applyTreeToScene(newData, scene);
                }}
                theme={FileExplorerTheme}
                canDrag={({ node }) => node.nodeType !== 'addCameraButton'}
                generateNodeProps={({ node, path }) => {
                  const isSelected = selectedPath?.join('.') === path.join('.');
                  const icon = iconMap[node.nodeType] || iconMap.unknown;

                  return {
                    style: isSelected ? { background: 'rgba(25,118,210,0.15)' } : undefined,
                    className: isSelected ? 'rst__rowSelected' : undefined,
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();

                      const isSameNode = selectedPath?.join('.') === path.join('.');

                      if (isSameNode) {
                        // Deselect
                        setSelectedPath(null);
                        setSettingsNode(null);
                        uiState.setSelected("");
                        setTransformTargetFunction?.(null);
                      } else {
                        // Select
                        setSelectedPath(path);
                        setSettingsNode(node);
                        if (node.nodeType === 'camera')
                          uiState.setSelected(node.uuid);
                        else
                          uiState.setSelected("");

                        setTransformTargetFunction?.(scene?.getObjectById(node.id));
                        if (!(node.type === "Group") && !(node.type === "AddButton") && !(node.title === "Model")) {
                          handleSettingsClick(node, path);
                        }
                      }
                    },
                    onContextMenu: (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPath(path);

                      setSettingsNode(node);
                      if (node.nodeType === 'camera')
                        uiState.setSelected(node.uuid);
                      else
                        uiState.setSelected("")

                      setTransformTargetFunction?.(scene?.getObjectById(node.id));
                      if (!(node.type === "Group") && !(node.type === "AddButton") && !(node.title === "Model")) {
                        handleSettingsClick(node, path)
                      }
                      setContextMenu({
                        mouseX: e.clientX - 2,
                        mouseY: e.clientY - 4,
                        node,
                        path,
                      });
                    },
                    icons: [icon],
                    title: (
                      <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center' }}>
                        {node.title}
                        {/* {node.subtitle && node.subtitle !== 'Group' && ` (${node.subtitle})`} */}

                        {node.object3D && node.type !== 'Group' && node.title !== 'Scene' && (
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(node); }} style={{ marginLeft: 8 }}>
                            {node.object3D.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          </IconButton>
                        )}

                        {node.nodeType === 'addCameraButton' && (
                          <IconButton onClick={() => onAddCameraClick?.(true)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        )}
                        {node.nodeType === 'addLightButton' && (
                          <IconButton onClick={() => onAddLightClick?.(true)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        )}
                      </span>
                    ),
                  };
                }}
              />
            </div>

            <div style={{ flex: '0 0 50%', borderTop: '1px solid #ddd' }}>
              <NodeSettingsPanel
                selectedNode={settingsNode}
                setSelectedNode={setSettingsNode}
                updateNodeFn={updateNodeFn}
                uiState={uiState as ModelUIState}
                scene={scene}
              />
            </div>
          </div>
        </div>

        {/* Open Button */}
        {!isOpen && (
          <IconButton
            onClick={() => setIsOpen(true)}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: panelBg,
              borderRadius: '50%',
              boxShadow: '0 0 4px rgba(0,0,0,0.3)',
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        {/* Context Menu */}
        <Menu
          open={!!contextMenu}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={() => { onAddCameraClick?.(contextMenu?.node); setContextMenu(null); }}>
            Add Camera
          </MenuItem>
          <MenuItem onClick={() => { onAddLightClick?.(contextMenu?.node); setContextMenu(null); }}>
            Add Light
          </MenuItem>

          {/* Conditionally render Remove Node */}
          {contextMenu && !typesExcludedFromRemove.includes(contextMenu.node.nodeType) && (
            <MenuItem
              onClick={() => {
                setNodeToDelete({ node: contextMenu.node, path: contextMenu.path });
                setContextMenu(null);
              }}
            >
              Remove Node
            </MenuItem>
          )}
        </Menu>


        {/* Delete Confirmation Dialog */}
        <Dialog open={!!nodeToDelete} onClose={() => setNodeToDelete(null)}>
          <DialogTitle>Are you sure you want to remove this node?</DialogTitle>
          <DialogActions>
            <Button onClick={() => setNodeToDelete(null)}>Cancel</Button>
            <Button
              color="error"
              onClick={() => {
                if (!nodeToDelete) return;
                const { path, node } = nodeToDelete;

                // Remove helper if exists
                const helper = scene?.getObjectByName(`${node.object3D?.name}_Helper`);
                if (helper && helper.parent) {
                  helper.parent.remove(helper);
                }

                // Remove object3D from scene
                if (node.object3D && node.object3D.parent) {
                  node.object3D.parent.remove(node.object3D);
                }

                const newTree = changeNodeAtPath({
                  treeData,
                  path,
                  getNodeKey: ({ treeIndex }) => treeIndex,
                  newNode: null,
                });

                setTreeData(newTree);
                setNodeToDelete(null);
              }}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>


      </div>
    );
  }
);

export default SceneTreeSortable;
