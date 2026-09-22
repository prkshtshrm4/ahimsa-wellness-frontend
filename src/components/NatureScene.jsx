import { useEffect, useRef } from 'react';

// Optional atmosphere: the portrait and all content remain usable without WebGL.
export default function NatureScene({ paused }) {
  const host = useRef(null);
  const pauseRef = useRef(paused);
  const syncRef = useRef(() => {});
  useEffect(() => { pauseRef.current = paused; syncRef.current(); }, [paused]);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || navigator.connection?.saveData) return;
    import('three').then((THREE) => {
      if (disposed || !host.current) return;
      const el = host.current;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 12);
      scene.add(new THREE.AmbientLight(0xf7edd7, 2.5));
      const light = new THREE.DirectionalLight(0xfff6dd, 4);
      light.position.set(-3, 5, 6); scene.add(light);
      const group = new THREE.Group(); scene.add(group);
      const rings = [];
      for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * .38, .007, 6, 160), new THREE.MeshBasicMaterial({ color: 0x9b987c, transparent: true, opacity: .25 - i * .025 }));
        ring.rotation.set(.15, -.18, 0); group.add(ring); rings.push(ring);
      }
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, -.85); leafShape.bezierCurveTo(-.65, -.3, -.6, .45, 0, .85); leafShape.bezierCurveTo(.55, .35, .55, -.3, 0, -.85);
      const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: .045, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .08, bevelThickness: .025, curveSegments: 16 });
      // Curl the leaf surface so the light moves across a real organic form.
      const positions = leafGeo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i);
        positions.setZ(i, positions.getZ(i) + .22 * (1 - y * y) - .48 * x * x + x * .12);
      }
      leafGeo.computeVertexNormals();
      const leaves = [];
      [ [-2.7, 1.7, .5, .55], [2.4, -1.5, 1, .8], [2.8, 2.3, -.2, .4] ].forEach(([x,y,z,scale], i) => {
        const leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: [0x71806a,0x526a4f,0xa09b6c][i], roughness: .55, metalness: .1 }));
        leaf.position.set(x,y,z); leaf.scale.setScalar(scale); leaf.rotation.set(.3, -.5, -.6 + i); group.add(leaf); leaves.push({ leaf, y });
      });
      let frame = 0, tick = 0, visible = false, lastTime = 0;
      const pointer = { x: 0, y: 0 };
      const render = (now) => {
        frame = 0;
        if (!visible || document.hidden || pauseRef.current || reduced.matches) return;
        const delta = lastTime ? Math.min((now - lastTime) / 1000, .04) : 0;
        lastTime = now;
        tick += delta * .4;
        group.rotation.y += (pointer.x - group.rotation.y) * .025;
        group.rotation.x += (pointer.y - group.rotation.x) * .025;
        leaves.forEach(({leaf, y}, i) => {
          leaf.position.y = y + Math.sin(tick + i) * .09;
          leaf.rotation.y = Math.sin(tick * .5 + i) * .3;
        });
        rings.forEach((ring, i) => {
          ring.rotation.x = .15 + Math.sin(tick * .3 + i * .1) * .08;
          ring.scale.setScalar(1 + Math.sin(tick * .6 + i * .2) * .012);
        });
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      const sync = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        if (visible && !document.hidden && !pauseRef.current && !reduced.matches) frame = requestAnimationFrame(render);
      };
      syncRef.current = sync;
      const resize = () => {
        const {width, height} = el.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const observer = new ResizeObserver(resize); observer.observe(el); resize();
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
      intersection.observe(el);
      const move = event => {
        if (event.pointerType === 'touch') return;
        pointer.x = (event.clientX / window.innerWidth - .5) * .14;
        pointer.y = (event.clientY / window.innerHeight - .5) * .1;
      };
      window.addEventListener('pointermove', move, {passive: true});
      document.addEventListener('visibilitychange', sync);
      reduced.addEventListener('change', sync);
      cleanup = () => {
        cancelAnimationFrame(frame);
        syncRef.current = () => {};
        observer.disconnect(); intersection.disconnect();
        window.removeEventListener('pointermove', move);
        document.removeEventListener('visibilitychange', sync);
        reduced.removeEventListener('change', sync);
        const resources = new Set();
        scene.traverse(o => { if (o.geometry) resources.add(o.geometry); if (o.material) resources.add(o.material); });
        resources.forEach(resource => resource.dispose());
        renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => { /* Static CSS halo is the fallback. */ });
    return () => { disposed=true; cleanup(); };
  }, []);
  return <div ref={host} className="nature-scene" aria-hidden="true" />;
}
