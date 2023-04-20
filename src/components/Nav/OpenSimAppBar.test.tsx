import React from 'react'
import { render, screen } from '@testing-library/react'
import OpenSimAppBar from './OpenSimAppBar'

function TestComponent() {
    const [dark, setDark] = React.useState<boolean>(true)

    return <OpenSimAppBar dark={dark} />
}

test('renders opensim-viewer toolbar', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('viewer-icon')).toBeInTheDocument()

    expect(screen.getByTestId('gallery-icon')).toBeInTheDocument()

})
