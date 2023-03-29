import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders opensim-viewer', () => {
  render(<App />);
  const titleElement = screen.getByText(/OpenSim Online Viewer/i);
  expect(titleElement).toBeInTheDocument();
});
