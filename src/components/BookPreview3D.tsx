import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PagePattern } from '../services/cutModes/cutAndFold.service';

interface BookPreview3DProps {
  pattern: PagePattern[];
  pageHeight: number; // in cm
  pageWidth?: number; // in cm, defaults to pageHeight / 1.5
  numberOfPages: number;
  unit?: 'cm' | 'in';
}

export const BookPreview3D: React.FC<BookPreview3DProps> = ({
  pattern,
  pageHeight,
  pageWidth,
  numberOfPages,
  unit = 'cm',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
  } | null>(null);

  // Convert to cm if needed
  const heightInCm = unit === 'in' ? pageHeight * 2.54 : pageHeight;
  const widthInCm = pageWidth
    ? (unit === 'in' ? pageWidth * 2.54 : pageWidth)
    : heightInCm / 1.5;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous scene
    if (sceneRef.current) {
      sceneRef.current.renderer.dispose();
      sceneRef.current.controls.dispose();
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );

    // Position camera to view the book from an angle
    const maxDimension = Math.max(heightInCm, widthInCm, numberOfPages * 0.01);
    camera.position.set(maxDimension * 1.5, maxDimension * 1.2, maxDimension * 1.5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Add a subtle fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Create book geometry
    createBook(scene, pattern, heightInCm, widthInCm, numberOfPages);

    // Store references
    sceneRef.current = { scene, camera, renderer, controls };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
        sceneRef.current.controls.dispose();
        containerRef.current?.removeChild(sceneRef.current.renderer.domElement);
      }
    };
  }, [pattern, heightInCm, widthInCm, numberOfPages]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    />
  );
};

function createBook(
  scene: THREE.Scene,
  pattern: PagePattern[],
  pageHeight: number,
  pageWidth: number,
  numberOfPages: number
) {
  const pageThickness = 0.01; // cm
  const bookDepth = numberOfPages * pageThickness;

  // Create book cover (back)
  const coverGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, 0.2);
  const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.7,
    metalness: 0.1,
  });
  const backCover = new THREE.Mesh(coverGeometry, coverMaterial);
  backCover.position.z = -bookDepth / 2 - 0.1;
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  scene.add(backCover);

  // Create pages with cut and fold patterns
  for (let i = 0; i < numberOfPages; i++) {
    const pagePattern = pattern.find(p => p.page === i + 1);
    const zPosition = -bookDepth / 2 + i * pageThickness;

    if (pagePattern && pagePattern.hasContent && pagePattern.zones.length > 0) {
      // Create page with fold zones
      createPageWithFolds(scene, pagePattern, pageHeight, pageWidth, zPosition, pageThickness);
    } else {
      // Create regular flat page
      createFlatPage(scene, pageHeight, pageWidth, zPosition, pageThickness);
    }
  }

  // Create book cover (front)
  const frontCover = backCover.clone();
  frontCover.position.z = bookDepth / 2 + 0.1;
  scene.add(frontCover);
}

function createFlatPage(
  scene: THREE.Scene,
  pageHeight: number,
  pageWidth: number,
  zPosition: number,
  thickness: number
) {
  const geometry = new THREE.BoxGeometry(pageWidth, pageHeight, thickness);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const page = new THREE.Mesh(geometry, material);
  page.position.z = zPosition;
  page.castShadow = true;
  page.receiveShadow = true;
  scene.add(page);
}

function createPageWithFolds(
  scene: THREE.Scene,
  pagePattern: PagePattern,
  pageHeight: number,
  pageWidth: number,
  zPosition: number,
  thickness: number
) {
  // For pages with fold zones, we'll create a more complex geometry
  // The page will have cuts and folds represented by displaced geometry

  const segments = 100; // Resolution for the page geometry
  const geometry = new THREE.BufferGeometry();

  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  // Calculate fold depths for each zone
  const foldDepths = pagePattern.zones.map(zone => zone.height * 0.3); // 30% of height as depth

  // Generate vertices
  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const xPos = (x / segments - 0.5) * pageWidth;
      const yPos = (y / segments - 0.5) * pageHeight;

      // Calculate Z displacement based on fold zones
      let zOffset = 0;
      const yFromTop = pageHeight / 2 - yPos; // Distance from top in cm

      for (let i = 0; i < pagePattern.zones.length; i++) {
        const zone = pagePattern.zones[i];
        const foldDepth = foldDepths[i];

        // Check if this point is within a fold zone
        if (yFromTop >= zone.startMark && yFromTop <= zone.endMark) {
          // Create a fold effect - paper goes inward
          const normalizedY = (yFromTop - zone.startMark) / (zone.endMark - zone.startMark);
          // Sine wave creates a smooth fold
          zOffset = Math.sin(normalizedY * Math.PI) * foldDepth;
        }
      }

      vertices.push(xPos, yPos, zOffset);
      normals.push(0, 0, 1); // Will be recalculated
    }
  }

  // Generate indices
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals(); // Compute proper normals for lighting

  const material = new THREE.MeshStandardMaterial({
    color: 0xfaf8f3,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const page = new THREE.Mesh(geometry, material);
  page.position.z = zPosition;
  page.castShadow = true;
  page.receiveShadow = true;
  scene.add(page);

  // Add edge lines for better visualization of folds
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 15); // 15 degree threshold
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  page.add(edges);
}
