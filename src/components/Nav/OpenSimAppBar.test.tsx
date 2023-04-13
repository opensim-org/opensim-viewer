import React from 'react'
import { render, screen } from '@testing-library/react'
import OpenSimAppBar from './OpenSimAppBar'

function TestComponent() {
  const [dark, setDark] = React.useState<boolean>(true)

  return <OpenSimAppBar dark={dark} />
}

test('renders opensim-viewer toolbar', () => {
  render(<TestComponent />)
  const viewerElement = screen.getByText(/Viewer/i)
  expect(viewerElement).toBeInTheDocument()

  const modelsElement = screen.getByText(/models/i)
  expect(modelsElement).toBeInTheDocument()
})
