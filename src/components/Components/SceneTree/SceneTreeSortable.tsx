import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import SortableTree from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css';
import { convertSceneToTree } from '../../../helpers/sceneToTree';
import FileExplorerTheme from '@nosferatu500/theme-file-explorer';
import {
  IconButton,
  useTheme,
  Theme,
  alpha,
} from '@mui/material';
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

import { useModelContext } from '../../../state/ModelUIStateContext';
import { ModelUIState } from '../../../state/ModelUIState';

import './SceneTreeSortable.css';

import NodeSettingsPanel from "./NodeSettingsPanel";

import {
  changeNodeAtPath,
} from '@nosferatu500/react-sortable-tree';

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
}

export const SceneTreeSortable = forwardRef<
  SceneTreeSortableHandle,
  SceneTreeSortableProps
>(
  (
    {
      scene,
      camera,
      height,
      sceneVersion,
      onAddCameraClick,
      onAddLightClick,
      setTransformTargetFunction,
      onWidthChange
    },
    ref,
  ) => {
    const theme = useTheme<Theme>();

    const [treeData, setTreeData] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [selectedPath, setSelectedPath] = useState<number[] | null>(null);

    const [settingsNode, setSettingsNode] = useState<any>(null);
    const [updateNodeFn, setUpdateNodeFn] = useState<((n: any) => void) | null>(null);

    const curState = useModelContext();
    const [uiState] = useState<ModelUIState>(curState);

    // outer wrapper of the whole panel
    const outerDivRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
      const w = isOpen ? PANEL_WIDTH : 0;
      onWidthChange?.(w);
    }, [isOpen, onWidthChange]);

    useImperativeHandle(
      ref,
      () => ({
        getWidth: () =>
          isOpen
            ? PANEL_WIDTH
            : 0,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }),
      [isOpen],
    );

    const [settingsPath, setSettingsPath] = useState<number[] | null>(null);

    function handleSettingsClick(node: any, path: number[]) {
      // remember which node we’re editing
      setSettingsNode(node);
      setSettingsPath(path);

      // build a node‑specific updater and give it to the panel
      const updateNode = (updatedNode: any) => {
        if (!path) return;
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
    }

    function updateNode(updatedNode: any) {
      const newTreeData = treeData.map((node) =>
        node.id === updatedNode.id ? updatedNode : node,
      );
      setTreeData(newTreeData);
    }

    const openSettings = (node: any) => {
      setSettingsNode(node);
      setUpdateNodeFn(() => updateNode);
    };

    useEffect(() => {
      setTreeData(convertSceneToTree(scene, camera));
    }, [scene, camera, sceneVersion]);

    const panelBg = alpha(theme.palette.background.paper, 0.9);
    const panelPadding = isOpen ? theme.spacing(1) : 0;

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
        {/* sliding panel */}
        <div
          style={{
            width: isOpen ? `${PANEL_WIDTH}px` : '0px',
            overflow: 'hidden',
            height,
            backgroundColor: panelBg,
            padding: panelPadding,
            transition: 'width 0.3s ease, padding 0.3s ease',
            boxShadow: isOpen ? (theme.shadows[4] as string) : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isOpen && (
            <IconButton
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                left: '-20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: alpha(theme.palette.background.paper, 0.9),
                borderRadius: '50%',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: '0 0 50%', overflow: 'auto' }}>
          <SortableTree
            treeData={treeData}
            onChange={setTreeData}
            theme={FileExplorerTheme}
            canDrag={({ node }) => !node.isAddCameraButton}
            generateNodeProps={({ node, path }) => {
              const isSelected = selectedPath?.join('.') === path.join('.');

              return {
                style: isSelected ? { background: 'rgba(25,118,210,0.15)' } : undefined,

                className: isSelected ? 'rst__rowSelected' : undefined,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedPath(path);
                  if (node.type?.includes('Camera')) uiState.setSelected(node.uuid);
                  if (setTransformTargetFunction)
                    setTransformTargetFunction(scene?.getObjectById(node.id));

                  if (node.canEdit) {
                    handleSettingsClick(node, path);
                  } else {
                    setSettingsNode(null); // clear settings if not editable
                  }
                },
                icons: node.isModel
                  ? [<PersonIcon key="model" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isGroup
                  ? [<FolderIcon key="group" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isCamera
                  ? [<CameraAltIcon key="camera" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isLight
                  ? [<LightbulbIcon key="light" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isAxes
                  ? [<ThreeDRotationIcon key="axes" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isSkySphere
                  ? [<PublicIcon key="sky" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isFloor
                  ? [<GridOnIcon key="floor" style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isAddCameraButton
                  ? []
                  : node.isAddLightButton
                  ? []
                  : [<HelpOutlineIcon key="unknown" style={{ marginRight: 10, fontSize: 16 }} />],
                title: (
                  <span
                    style={{
                      marginLeft: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {node.title} {node.subtitle && node.subtitle !== "Group" ? "(" + node.subtitle + ")" : ""}
                    {node.canEdit && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          node.visible = !node.visible;
                          node.object3D.visible = node.visible;
                          setTreeData([...treeData]);
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        {node.visible ? (
                          <VisibilityIcon fontSize="small" />
                        ) : (
                          <VisibilityOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                    {node.isAddCameraButton && (
                      <IconButton
                        size="small"
                        onClick={() => onAddCameraClick?.(true)}
                        style={{ padding: '4px', marginLeft: '4px' }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                    {node.isAddLightButton && (
                      <IconButton
                        size="small"
                        onClick={() => onAddLightClick?.(true)}
                        style={{ padding: '4px', marginLeft: '4px' }}
                      >
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
            uiState={uiState}
          />
        </div>
      </div>
        </div>

        {!isOpen && (
          <IconButton
            onClick={() => setIsOpen(true)}
            style={{
              position: 'absolute',
              right: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: alpha(theme.palette.background.paper, 0.9),
              borderRadius: '50%',
              boxShadow: '0 0 4px rgba(0,0,0,0.3)',
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </div>
    );
  },
);

export default SceneTreeSortable;
