import React, { ReactNode } from 'react'
import Grid from '@mui/material/Unstable_Grid2'

interface ResponsiveContainerProps {
    children: ReactNode
}

const ResponsiveContainer = ({ children }: ResponsiveContainerProps) => {
    return (
        <Grid container spacing={2} justifyContent="center">
            <Grid xs={10} sm={10} md={8} lg={8} component="div">
                {children}
            </Grid>
        </Grid>
    )
}

export default ResponsiveContainer
