import { TreeView } from '@mui/x-tree-view/TreeView'; 
import { TreeNode } from '../../helpers/SceneTreeModel';
import { observer } from 'mobx-react';
import { useModelContext } from '../../state/ModelUIStateContext';
import SceneTreeModelGUI from '../../helpers/SceneTreeModelGUI';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useEffect, useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TargetListModel from '../../helpers/TargetListModel';
import React from "react";
import { Typography, Menu, MenuItem } from "@mui/material";
import { Object3D } from 'three';

interface ContextMenuPosition {
  mouseX: number;
  mouseY: number;
}

const NodeWithContextMenu: React.FC<{ label: string, obj: Object3D | null }> = ({ label, obj }) => {
  const [contextMenu, setContextMenu] = React.useState<ContextMenuPosition | null>(null);
  const [thisObj] = React.useState<Object3D | null>(obj)
  const curState = useModelContext();

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleLookAt = () => {
    curState.viewerState.setLookAtTarget(thisObj!.uuid);
    setContextMenu(null);
  };

  return (
    <div onContextMenu={handleContextMenu} style={{ cursor: "context-menu" }}>
      <Typography>{label}</Typography>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem onClick={handleClose}>Add Camera to {thisObj===null? "":thisObj.name}</MenuItem>
        <MenuItem onClick={handleClose}>Add Light to {thisObj===null? "":thisObj.name}</MenuItem>
        <MenuItem onClick={handleLookAt}>Look At</MenuItem>
      </Menu>
    </div>
  );
};

const renderTree = (nodes: TreeNode): JSX.Element => (
  <TreeItem key={nodes.threeObject!.uuid} nodeId={nodes.threeObject!.uuid}   
  label={<NodeWithContextMenu label={nodes.name} obj={nodes.threeObject}/>}>
    {Array.isArray(nodes.children)
      ? nodes.children.map((child) => renderTree(child))
      : null}
  </TreeItem>
);

const SceneTreeView  = ()  => {
    const curState = useModelContext();
    const [treeVersion, setTreeVersion] = useState(0);

    const handleSelect = async (event: any, node: any) => {
      //console.log('nodeId: ', node)
      curState.setSelected(node as string, false);
    }

    const sTree = curState.sceneTree
    if (sTree === null && curState.scene !== null) {
      // console.log(curState.scene);
      curState.setSceneTree(new SceneTreeModelGUI(curState.scene!));
      curState.viewerState.setTargetList(new TargetListModel(curState.scene!).getTargets());
      setTreeVersion(curState.viewerState.sceneVersion);
      console.log("TreeVersion", treeVersion)
    }

    useEffect(() => {
      console.log('SceneTreeView useEffect called');

      if (treeVersion <curState.viewerState.sceneVersion){
        curState.setSceneTree(new SceneTreeModelGUI(curState.scene!));
        curState.viewerState.setTargetList(new TargetListModel(curState.scene!).getTargets());
        console.log('SceneTreeView useEffect called');
        setTreeVersion(curState.viewerState.sceneVersion);
        console.log("TreeVersion", treeVersion)
      }
    }, [curState, curState.viewerState.sceneVersion, treeVersion])

    return (<>
        <TreeView
            aria-label="file system navigator"
            sx={{ flexGrow: 1, maxWidth: 450, overflowY: 'auto' }}
            defaultCollapseIcon={<FolderOpenIcon  />}
            defaultExpandIcon={<FolderIcon />}
            onNodeSelect={handleSelect}
            selected={curState.selected}
        >
        {renderTree(curState.sceneTree?.rootNode!) }
        </TreeView>
        </>
    );
}

export default observer(SceneTreeView);