import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders opensim-viewer', () => {
    render(<App />)
    const titleElement = screen.getByText(/welcome_title/i) // This is the key expected by i18n.
    expect(titleElement).toBeInTheDocument()
})
