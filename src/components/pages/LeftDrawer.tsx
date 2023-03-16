import { Drawer, IconButton } from "@mui/material";
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone';
import LayersTwoToneIcon from '@mui/icons-material/LayersTwoTone';

const LeftDrawer = () => {
    return (
    <Drawer anchor="left" variant="permanent">
        <IconButton color="secondary">
            <SettingsTwoToneIcon/>
        </IconButton>
        <IconButton color="secondary">
            <AccountTreeTwoToneIcon/>
        </IconButton>
        <IconButton color="secondary">
            <LayersTwoToneIcon/>
        </IconButton>
    </Drawer>
    );
}

export default LeftDrawer;