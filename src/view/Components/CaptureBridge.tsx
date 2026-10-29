// src/view/Components/CaptureBridge.tsx 
//
// Headless capture hook. Only active when the page URL has ?capture=1.
// Exposes window.__viewer so an external driver (Playwright) can step the animation
// clock frame by frame and read back the rendered canvas as PNG.
//
// Relies on the viewer's existing external-time mechanism
// (viewerState.isTimeControlledExternally / viewerState.externalAnimationTime),
// which OpenSimGUIScene applies on every useFrame.

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useModelContext } from '../../state/ModelUIStateContext';

// Extra camera distance for the 'frontal' preset, in scene units/meters
const FRONTAL_EXTRA_DISTANCE = 1.5;

declare global {
  interface Window {
    __viewer?: any;
  }
}

// Wait n animation frames so R3F's useFrame (which applies the animation time) and the
// following gl.render have both run.
const nextFrames = (n = 2) =>
  new Promise<void>((resolve) => {
    const step = (k: number): void => {
      if (k <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(k - 1));
    };
    step(n);
  });

export default function CaptureBridge() {
  const { gl, scene, camera, controls } = useThree();
  const ui = useModelContext();

  useEffect(() => {
    // match in the whole URL, so it also works when the router keeps its query inside the #hash
    if (!/[?&]capture=1(&|$)/.test(window.location.href)) return;

    const vs: any = ui.viewerState;
    const modelsGroup = () => scene.getObjectByName('Models');
    const clipIndex = () => {
      const i = vs.currentAnimationIndices?.[0];
      return i === undefined || i < 0 ? 0 : i;
    };

    window.__viewer = {
      // Resolves once the model and at least one animation clip are loaded.
      async ready(timeoutMs = 60000) {
        const t0 = performance.now();
        while (!(vs.animations?.length > 0 && (modelsGroup()?.children.length ?? 0) > 0)) {
          if (performance.now() - t0 > timeoutMs) {
            throw new Error('viewer: model/animation not loaded in time');
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        vs.isTimeControlledExternally = true; // hand the animation clock to the driver
        await nextFrames(3);
        // Keyframe times are the original motion times, so the clip does not start at 0.
        // startTime = earliest first keyframe over all tracks; duration = clip end time.
        const clip = vs.animations[clipIndex()];
        const startTime = clip.tracks.length
          ? clip.tracks.reduce((m: number, tr: any) => Math.min(m, tr.times[0]), Infinity)
          : 0;
        return { startTime, duration: clip.duration, clips: vs.animations.length };
      },

      // preset: 'sagittal' | 'frontal' | 'iso' | 'fit' | { position:[x,y,z], target:[x,y,z] }
      // OpenSim convention: +X forward, +Y up, +Z right. Sagittal looks along -Z.
      setCamera(preset: any) {
        if (preset === 'fit') return; // keep the viewer's own fitCameraTo result
        const box = new THREE.Box3().setFromObject(modelsGroup() ?? scene);
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const r = Math.max(size.x, size.y, size.z) * 2.2 || 2;

        let pos: THREE.Vector3;
        let target = c;
        if (preset && typeof preset === 'object') {
          pos = new THREE.Vector3(...(preset.position as [number, number, number]));
          target = new THREE.Vector3(...(preset.target as [number, number, number]));
        } else if (preset === 'frontal') {
          pos = c.clone().add(new THREE.Vector3(r + FRONTAL_EXTRA_DISTANCE, 0, 0));
        } else if (preset === 'iso') {
          pos = c.clone().add(new THREE.Vector3(r * 0.7, r * 0.4, r * 0.7));
        } else {
          pos = c.clone().add(new THREE.Vector3(0, 0, r)); // sagittal
        }
        camera.position.copy(pos);
        camera.lookAt(target);
        const ctl: any = controls;
        ctl?.target?.copy(target);
        ctl?.update?.();
        camera.updateProjectionMatrix();
      },

      // Set animation time (seconds, clip-local), wait for the render, return the canvas as base64 PNG.
      async frame(t: number) {
        vs.externalAnimationTime = t;
        await nextFrames(2);
        return gl.domElement.toDataURL('image/png').split(',')[1];
      },
    };

    return () => {
      delete window.__viewer;
    };
  }, [ui, scene, camera, gl, controls]);

  return null;
}
