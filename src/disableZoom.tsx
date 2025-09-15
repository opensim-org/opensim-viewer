import React, { useEffect } from 'react';

function DisableZoom() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Disable zoom from Ctrl/⌘ + scroll, and from pinch-to-zoom on touchpads
      if (e.ctrlKey || e.metaKey || e.deltaZ !== 0) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable zoom from Ctrl/⌘ + (+/-/=) keys
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
        e.preventDefault();
      }
    };

    // Use { passive: false } so preventDefault actually works
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}

export default DisableZoom;
