import { Drawer, IconButton } from "@mui/material";
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone';
import LayersTwoToneIcon from '@mui/icons-material/LayersTwoTone';
import StackedLineChartTwoToneIcon from '@mui/icons-material/StackedLineChartTwoTone';

interface SettingsProps {
    placement: "left"|"right"|"top"|"bottom";
}
const SettingsDrawer = (props: SettingsProps) => {
    return (
    <Drawer anchor={props.placement} variant="temporary" >
        <IconButton color="primary">
            <SettingsTwoToneIcon/>
        </IconButton>
        <IconButton color="primary">
            <AccountTreeTwoToneIcon/>
        </IconButton>
        <IconButton color="primary">
            <LayersTwoToneIcon/>
        </IconButton>
        <IconButton color="primary">
            <StackedLineChartTwoToneIcon/>
        </IconButton>
    </Drawer>
    );
}

export default SettingsDrawer;