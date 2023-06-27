import {Stack }  from "@mui/material";
import TreeView from '@mui/lab/TreeView'; 
import TreeItem from "@mui/lab/TreeItem";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const SceneTreeView  = ()  => {
    return (
    <Stack spacing={5} direction="row">
        <TreeView
            aria-label="file system navigator"
            sx={{ flexGrow: 10, maxWidth: 400, overflowY: 'auto' }}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
        >   
            <TreeItem nodeId="1" label={"RootNode"}>
                <TreeItem nodeId="2" label={"Camera"}/>
                <TreeItem nodeId="3" label={"Lights"}/>
                <TreeItem nodeId="4" label={"Model"}/>
            </TreeItem>
        </TreeView>
    </Stack>
    );
}

export default SceneTreeView;