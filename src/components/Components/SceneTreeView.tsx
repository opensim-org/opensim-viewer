import { TreeView } from '@mui/x-tree-view/TreeView'; 
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import SceneTreeItem from './SceneTreeItem';
import SceneTreeModel, { TreeNode } from '../../helpers/SceneTreeModel';
import { observer } from 'mobx-react';
import { useModelContext } from '../../state/ModelUIStateContext';
import SceneTreeModelGUI from '../../helpers/SceneTreeModelGUI';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useEffect, useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import TargetListModel from '../../helpers/TargetListModel';
import saveAs from 'file-saver';


const renderTree = (nodes: TreeNode): JSX.Element => (
  <TreeItem key={nodes.threeObject!.uuid} nodeId={nodes.threeObject!.uuid}   label={
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{nodes.name}</span>
      {nodes.threeObject!.visible?
      (<VisibilityIcon onClick={() => {nodes.threeObject!.visible=false;}} />):
      <VisibilityOffIcon onClick={() => {nodes.threeObject!.visible=true;}} />}

      {(nodes.name==="OpenSim Environment")?<SaveIcon onClick={() => {
                  var json = nodes.threeObject!.toJSON();
                  const blob = new Blob( [ JSON.stringify( json ) ], { type: 'application/json' } );
                  saveAs(blob, "my_environment.json");
      }} />:""}
    </div>
  }>
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

    return (
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
    );
}

export default observer(SceneTreeView);