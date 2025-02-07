import TreeView from '@mui/lab/TreeView'; 
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import SceneTreeItem from './SceneTreeItem';
import SceneTreeModel, { TreeNode } from '../../helpers/SceneTreeModel';
import { observer } from 'mobx-react';
import { useModelContext } from '../../state/ModelUIStateContext';

function MinusSquare(props: SvgIconProps) {
    return (
      <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
        {/* tslint:disable-next-line: max-line-length */}
        <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
      </SvgIcon>
    );
  }

  function PlusSquare(props: SvgIconProps) {
    return (
      <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
        {/* tslint:disable-next-line: max-line-length */}
        <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
      </SvgIcon>
    );
  }

  function CloseSquare(props: SvgIconProps) {
    return (
      <SvgIcon
        className="close"
        fontSize="inherit"
        style={{ width: 14, height: 14 }}
        {...props}
      >
        {/* tslint:disable-next-line: max-line-length */}
        <path d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z" />
      </SvgIcon>
    );
  }

const SceneTreeView  = ()  => {
  const curState = useModelContext();
    function createTreeItemForNode(anode: TreeNode, index: number) {
        let computeId = (3+index);
        let threeObj = anode.threeObject;
        //console.log(threeObj);
        return <SceneTreeItem nodeId={threeObj!.uuid} label={anode.name} key={computeId} />
    }
    const handleSelect = async (event: any, node: any) => {
      //console.log('nodeId: ', node)
      curState.setSelected(node as string);
    }
    const sTree = curState.sceneTree
    if (sTree === null && curState.scene !== null) {
      // console.log(curState.scene);
      ///curState.setSceneTree(new SceneTreeModel(curState.scene!));
    }
    const meshesNode = (sTree === null)? null: sTree.rootNode?.children[0]
    const meshesArray = (sTree === null)? null: meshesNode?.children;
    return (
        <TreeView
            aria-label="file system navigator"
            sx={{ flexGrow: 1, maxWidth: 450, overflowY: 'auto' }}
            defaultCollapseIcon={<MinusSquare />}
            defaultExpandIcon={<PlusSquare />}
            defaultEndIcon={<CloseSquare />}
            onNodeSelect={handleSelect}
            selected={curState.selected}
        >
            <SceneTreeItem  nodeId="1" label={sTree?.rootNode?.name} key={1} >
                <SceneTreeItem  nodeId="2" label={sTree?.rootNode?.children[0].name} key={2}>
                    {meshesArray?.map(createTreeItemForNode, meshesArray)}
                </SceneTreeItem>
            </SceneTreeItem>
        </TreeView>
    );
}

export default observer(SceneTreeView);