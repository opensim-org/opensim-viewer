import React from 'react'
import { render, screen } from '@testing-library/react'
import ModelListPage from './ModelListPage'
import viewerState from '../../../state/ViewerState';

test('renders model-list-page', () => {
    render(<ModelListPage featuredModelsFilePath={viewerState.featuredModelsFilePath}/>)
    const titleElement = screen.getByText(/modelList.modelGalleryTitle/i) // This is the key expected by i18n.
    expect(titleElement).toBeInTheDocument()
})
