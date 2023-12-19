import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => {
    return {
      transcode: jest.fn(),
      // Add other methods as needed
    };
  }),
}));

jest.mock('chartjs-wrapper', () => ({
  ChartJSWrapper: jest.fn().mockImplementation(() => {
    return {
      // Mock the methods of ChartJSWrapper that you use
    };
  }),
}));

test('renders landing-page', () => {
    render(<App />)
    const titleElement = screen.getByText(/welcome_title/i) // This is the key expected by i18n.
    expect(titleElement).toBeInTheDocument()
})
