import React from 'react'
import { render, screen } from '@testing-library/react'
import OpenSimAppBar from './OpenSimAppBar'
import { BrowserRouter as Router } from 'react-router-dom'
import '../../internationalization/i18n'

function TestComponent() {
    const [dark, _] = React.useState<boolean>(true)

    return <OpenSimAppBar dark={true} isLoggedIn={true}/>
}

test('renders opensim-viewer toolbar', () => {
    render(
        <Router>
            <TestComponent />
        </Router>
    )
    const viewerElement = screen.getByText(/Viewer/i)
    expect(viewerElement).toBeInTheDocument()

    const modelsElement = screen.getByText(/models/i)
    expect(modelsElement).toBeInTheDocument()
})
