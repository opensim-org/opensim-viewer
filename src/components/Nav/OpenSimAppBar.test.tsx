import React from 'react';
import { render, screen } from '@testing-library/react';
import OpenSimAppBar from './OpenSimAppBar';

// This just tests the AppBar, should check for Logo, logo-theme and routing
// while testing individual choices is delegated to downstream Components
test('renders opensim-viewer toolbar', () => {
    render(<OpenSimAppBar />);
    const viewerElement = screen.getByText(/Viewer/i);
    expect(viewerElement).toBeInTheDocument();

    const modelsElement = screen.getByText(/models/i);
    expect(modelsElement).toBeInTheDocument();
  });
