import React, { useEffect, useState } from 'react';
import SortableTree from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css';
import { convertSceneToTree } from '../../helpers/sceneToTree';
import FileExplorerTheme from '@nosferatu500/theme-file-explorer';
import { IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
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

interface SceneTreeSortableProps {
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  height: string;
  sceneVersion?: number;
  onSettingsClick?: (node: any, updateNode: (updatedNode: any) => void) => void;
  onAddCameraClick?: (node: any) => void;
}

export function SceneTreeSortable({ scene, camera, height, sceneVersion, onSettingsClick, onAddCameraClick }: SceneTreeSortableProps) {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  function updateNode(updatedNode: any) {
    const newTreeData = treeData.map(node => {
      if (node.id === updatedNode.id) return updatedNode;
      return node;
    });
    setTreeData(newTreeData);
  }

  useEffect(() => {
    setTreeData(convertSceneToTree(scene, camera));
  }, [scene, camera, sceneVersion]);

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, height: height, display: 'flex', flexDirection: 'row' }}>
      {/* Slide-out panel */}
      <div style={{
        width: isOpen ? '300px' : '0',
        overflow: 'hidden',
        height: height,
        background: 'rgba(255,255,255,0.9)',
        padding: isOpen ? '8px' : '0',
        transition: 'width 0.3s ease',
        boxShadow: isOpen ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
      }}>
        {isOpen && (
          <>
            {/* Collapse button (left border, middle vertically) */}
            <IconButton
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                left: '-20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>

            {/* Tree View */}
            <SortableTree
              treeData={treeData}
              onChange={setTreeData}
              theme={FileExplorerTheme}
              generateNodeProps={({ node }) => ({
                icons: node.isModel
                  ? [<PersonIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isGroup
                  ? [<FolderIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isCamera
                  ? [<CameraAltIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isLight
                  ? [<LightbulbIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isAxes
                  ? [<ThreeDRotationIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isSkySphere
                  ? [<PublicIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isFloor
                  ? [<GridOnIcon style={{ marginRight: 10, fontSize: 16 }} />]
                  : node.isAddCameraButton
                  ? []
                  : [<HelpOutlineIcon style={{ marginRight: 10, fontSize: 16 }} />],
                title: (
                  <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center' }}>
                    {node.title || node.subtitle}
                    {node.canEdit && (
                      <>
                        <input
                          type="checkbox"
                          checked={node.visible}
                          onChange={(e) => {
                            node.visible = e.target.checked;
                            node.object3D.visible = e.target.checked;
                            setTreeData([...treeData]);
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => onSettingsClick?.(node, updateNode)}
                          style={{ padding: '4px', marginLeft: '4px' }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </>
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
                  </span>
                )
              })}
            />
          </>
        )}
      </div>

      {/* Expand button (right edge, when collapsed) */}
      {!isOpen && (
        <IconButton
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            right: '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'white',
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
}

export default SceneTreeSortable;
