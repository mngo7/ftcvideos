// A 3D view of a robot made by btb_robot.py: a Gaussian splat in the .splat format, shown with
// GaussianSplats3D (MIT, https://github.com/mkkellogg/GaussianSplats3D). The page maps "three" in an importmap.
//
// One video sees a robot from one side, so the view is kept to the directions the video saw it from
// (robot.json: sweep, in degrees) and swings back and forth there.
import * as THREE from 'three';
import * as GaussianSplats3D from 'https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@0.4.7/build/gaussian-splats-3d.module.js';

const VIEWER_FOV = 50;   // the camera of GaussianSplats3D
let viewer = null;

export async function show(canvas, url, viewUrl) {
    const view = (viewUrl ? await fetch(viewUrl).then(r => r.json()).catch(() => null) : null) ||
        {position: [0, -0.6, -2.2], lookAt: [0, 0, 0], up: [0, -1, 0], fov: 40, sweep: 60};
    if (viewer) {
        await viewer.dispose().catch(() => {});
        viewer = null;
    }
    const box = document.createElement('div');
    box.style.cssText = 'width:100%;aspect-ratio:1;border-radius:6px;overflow:hidden;background:#121214;position:relative';
    canvas.replaceWith(box);
    // as far back as needed to show what the renders of btb_robot.py show, with the wider viewer lens
    const target = new THREE.Vector3(...view.lookAt);
    const back = Math.tan(THREE.MathUtils.degToRad((view.fov || 40) / 2)) / Math.tan(THREE.MathUtils.degToRad(VIEWER_FOV / 2));
    const position = new THREE.Vector3(...view.position).sub(target).multiplyScalar(Math.max(1, back)).add(target);
    viewer = new GaussianSplats3D.Viewer({
        rootElement: box,
        cameraUp: view.up,
        initialCameraPosition: position.toArray(),
        initialCameraLookAt: view.lookAt,
        sharedMemoryForWorkers: false,
        dynamicScene: false,
        sphericalHarmonicsDegree: 0,
        logLevel: GaussianSplats3D.LogLevel.None,
    });
    await viewer.addSplatScene(url, {format: GaussianSplats3D.SceneFormat.Splat, showLoadingUI: true,
                                     progressiveLoad: false});
    viewer.start();
    const controls = viewer.controls;
    if (!controls) return viewer;
    const half = THREE.MathUtils.degToRad((view.sweep || 60) / 2 + 10);
    const azimuth = controls.getAzimuthalAngle();
    const polar = controls.getPolarAngle();
    const distance = controls.getDistance();
    controls.minAzimuthAngle = azimuth - half;
    controls.maxAzimuthAngle = azimuth + half;
    controls.minPolarAngle = Math.max(0.05, polar - 0.45);
    controls.maxPolarAngle = Math.min(Math.PI - 0.05, polar + 0.35);
    controls.minDistance = distance * 0.5;
    controls.maxDistance = distance * 1.6;
    controls.enablePan = false;
    // swing between the limits until the viewer touches it
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener('change', () => {
        const a = controls.getAzimuthalAngle();
        if ((a >= controls.maxAzimuthAngle - 0.01 && controls.autoRotateSpeed < 0) ||
            (a <= controls.minAzimuthAngle + 0.01 && controls.autoRotateSpeed > 0)) {
            controls.autoRotateSpeed = -controls.autoRotateSpeed;
        }
    });
    box.addEventListener('pointerdown', () => { controls.autoRotate = false; }, {once: true});
    return viewer;
}
