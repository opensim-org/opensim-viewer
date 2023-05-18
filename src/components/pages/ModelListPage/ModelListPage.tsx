import React from 'react'
import { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'

import ResponsiveContainer from '../../ResponsiveContainer/ResponsiveContainer'
import GridList from './GridList'

import { useTranslation } from 'react-i18next'

type ModelMetadataType = {
    id: number
    name: string
    description: string
    author: string
    image: string
    path: string
    link: string
    license: string
    licenseLink: string
}

interface ModelListPageProps {
    featuredModelsFilePath: string
}

const ModelListPage: React.FC<ModelListPageProps> = ({ featuredModelsFilePath }) => {
    const { t } = useTranslation();

    const [models, setModels] = useState<ModelMetadataType[]>([])

    useEffect(() => {
        fetch(featuredModelsFilePath)
            .then((response) => response.json())
            .then((data) => {
                // convert the models object to an array
                const modelArray: ModelMetadataType[] = Object.values(data.models)
                // update the state with the model array
                setModels(modelArray)
            })
    })

    return (
        <>
            <Typography variant="h3" style={{ marginTop: 100, marginBottom: 100 }}>
                {' '}
                {t('modelList.modelGalleryTitle')} {' '}
            </Typography>

            <ResponsiveContainer>
                <GridList modelMetadata={models} />
            </ResponsiveContainer>
        </>
    )
}
export default ModelListPage
export type { ModelMetadataType }
