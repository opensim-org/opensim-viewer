import {Stack }  from "@mui/material";
import TreeView from '@mui/lab/TreeView'; 
import TreeItem from "@mui/lab/TreeItem";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import viewerState from "../../state/ViewerState";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
const SceneTreeView  = ()  => {
    function createTreeItemForNode(anode: { name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }, index: number) {
        let computeId = (3+index);
        return <TreeItem nodeId={computeId.toString()} label={anode.name} key={computeId}/>
    }
    const sTree = viewerState.sceneTree
    const meshesNode = sTree?.rootNode?.children[0]
    const meshesArray = meshesNode?.children;
    return (
    <Stack spacing={2} direction="row">
        <TreeView
            aria-label="file system navigator"
            sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
        >   
            <TreeItem nodeId="1" label={sTree?.rootNode?.name} key={1}>
                <TreeItem nodeId="2" label={sTree?.rootNode?.children[0].name} key={2}>
                    {meshesArray?.map(createTreeItemForNode)}
                </TreeItem>
            </TreeItem>
        </TreeView>
    </Stack>
    );
}

export default SceneTreeView;