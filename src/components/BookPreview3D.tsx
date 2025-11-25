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
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    animationId: number;
  } | null>(null);

  // Convert to cm if needed
  const heightInCm = unit === 'in' ? pageHeight * 2.54 : pageHeight;
  const widthInCm = pageWidth
    ? (unit === 'in' ? pageWidth * 2.54 : pageWidth)
    : heightInCm / 1.5;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Clean up any existing scene
    if (sceneRef.current) {
      cancelAnimationFrame(sceneRef.current.animationId);
      sceneRef.current.controls.dispose();
      sceneRef.current.renderer.dispose();
    }

    // Remove all existing children from container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Calculate book depth with folded pages
    const bookDepthInfo = calculateBookDepth(pattern, numberOfPages);
    const maxDimension = Math.max(heightInCm, widthInCm, bookDepthInfo.totalDepth);

    console.log('BookPreview3D - totalDepth:', bookDepthInfo.totalDepth);
    console.log('BookPreview3D - maxDimension:', maxDimension);
    console.log('BookPreview3D - pattern:', pattern.length, 'pages');

    // Position camera to view the book from an angle
    camera.position.set(maxDimension * 1.5, maxDimension * 1.2, maxDimension * 1.5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

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
    createBook(scene, pattern, heightInCm, widthInCm, numberOfPages, bookDepthInfo);

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    const animationId = requestAnimationFrame(animate);
    sceneRef.current = { renderer, controls, animationId };

    // Handle resize
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
        sceneRef.current = null;
      }
      // Remove all children from container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
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

interface BookDepthInfo {
  totalDepth: number;
  pageDepths: Map<number, number>; // page number -> depth at that page
}

function calculateBookDepth(pattern: PagePattern[], numberOfPages: number): BookDepthInfo {
  const basePageThickness = 0.01; // cm per page
  // Extra thickness per folded page (folds add depth to the book)
  const foldExtraThickness = 0.05; // cm - small addition to keep book reasonable

  const pageDepths = new Map<number, number>();
  let currentDepth = 0;

  for (let i = 0; i < numberOfPages; i++) {
    pageDepths.set(i, currentDepth); // Store depth BEFORE page i

    const pagePattern = pattern.find(p => p.page === i + 1);

    if (pagePattern && pagePattern.hasContent && pagePattern.zones.length > 0) {
      // Page with folds: add base thickness + extra for folds
      currentDepth += basePageThickness + foldExtraThickness;
    } else {
      // Regular page: just base thickness
      currentDepth += basePageThickness;
    }
  }

  return {
    totalDepth: currentDepth,
    pageDepths
  };
}

function createBook(
  scene: THREE.Scene,
  pattern: PagePattern[],
  pageHeight: number,
  pageWidth: number,
  numberOfPages: number,
  bookDepthInfo: BookDepthInfo
) {
  const { totalDepth, pageDepths } = bookDepthInfo;

  // Create book cover (back)
  const coverGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, 0.2);
  const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.7,
    metalness: 0.1,
  });
  const backCover = new THREE.Mesh(coverGeometry, coverMaterial);
  backCover.position.z = -totalDepth / 2 - 0.1;
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  scene.add(backCover);

  // Create pages with cut and fold patterns
  for (let i = 0; i < numberOfPages; i++) {
    const pagePattern = pattern.find(p => p.page === i + 1);
    const zPosition = -totalDepth / 2 + pageDepths.get(i)!;

    if (pagePattern && pagePattern.hasContent && pagePattern.zones.length > 0) {
      // Create page with fold zones
      createPageWithCutsAndFolds(scene, pagePattern, pageHeight, pageWidth, zPosition);
    } else {
      // Create regular flat page
      createFlatPage(scene, pageHeight, pageWidth, zPosition, 0.01);
    }
  }

  // Create book cover (front)
  const frontCover = backCover.clone();
  frontCover.position.z = totalDepth / 2 + 0.1;
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

function createPageWithCutsAndFolds(
  scene: THREE.Scene,
  pagePattern: PagePattern,
  pageHeight: number,
  pageWidth: number,
  zPosition: number
) {
  const cutDepth = 1; // 1cm cuts from the edge
  const thickness = 0.01; // page thickness

  // Sort zones by startMark to process them in order
  const sortedZones = [...pagePattern.zones].sort((a, b) => a.startMark - b.startMark);

  // Create a group for this page
  const pageGroup = new THREE.Group();
  pageGroup.position.z = zPosition;

  const material = new THREE.MeshStandardMaterial({
    color: 0xfaf8f3,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Collect all Y positions (from top) where we need to split
  const yPositions: number[] = [0]; // Start at top

  for (const zone of sortedZones) {
    if (!yPositions.includes(zone.startMark)) {
      yPositions.push(zone.startMark);
    }
    if (!yPositions.includes(zone.endMark)) {
      yPositions.push(zone.endMark);
    }
  }
  yPositions.push(pageHeight); // End at bottom
  yPositions.sort((a, b) => a - b);

  // Create each segment
  for (let i = 0; i < yPositions.length - 1; i++) {
    const segmentStartY = yPositions[i];
    const segmentEndY = yPositions[i + 1];
    const segmentHeight = segmentEndY - segmentStartY;

    // Check if this segment is part of a fold zone
    const isInFoldZone = sortedZones.some(
      zone => segmentStartY >= zone.startMark && segmentEndY <= zone.endMark
    );

    // Calculate Y position (convert from top-down measurement to center-based)
    const segmentCenterY = pageHeight / 2 - (segmentStartY + segmentHeight / 2);

    if (isInFoldZone) {
      // Create the folded section as a trapezoid shape
      createFoldedSection(pageGroup, material, pageWidth, segmentHeight, segmentCenterY, cutDepth, thickness);
    } else {
      // Regular segment without fold
      const segmentGeometry = new THREE.BoxGeometry(
        pageWidth,
        segmentHeight,
        thickness
      );
      const segment = new THREE.Mesh(segmentGeometry, material);
      segment.position.set(0, segmentCenterY, 0);
      segment.castShadow = true;
      segment.receiveShadow = true;
      pageGroup.add(segment);
    }
  }

  scene.add(pageGroup);
}

function createFoldedSection(
  pageGroup: THREE.Group,
  material: THREE.MeshStandardMaterial,
  pageWidth: number,
  segmentHeight: number,
  segmentCenterY: number,
  cutDepth: number,
  thickness: number
) {
  // Create the main part of the page (from spine to cut line)
  const mainPartGeometry = new THREE.BoxGeometry(
    pageWidth - cutDepth,
    segmentHeight,
    thickness
  );
  const mainPart = new THREE.Mesh(mainPartGeometry, material);
  mainPart.position.set(
    cutDepth / 2, // Shift right to leave space on the left (outer edge)
    segmentCenterY,
    0
  );
  mainPart.castShadow = true;
  mainPart.receiveShadow = true;
  pageGroup.add(mainPart);

  // Create the folded part as a trapezoid opening outward
  // This creates the 3D "fan" effect shown in your diagram
  const foldGeometry = createTrapezoidGeometry(segmentHeight, cutDepth, thickness);
  const foldedPart = new THREE.Mesh(foldGeometry, material);

  // Position at the outer edge (left side)
  foldedPart.position.set(
    -pageWidth / 2 + cutDepth / 2, // At the left edge (outer edge)
    segmentCenterY,
    cutDepth / 2 // Slightly forward, but contained
  );

  foldedPart.castShadow = true;
  foldedPart.receiveShadow = true;
  pageGroup.add(foldedPart);

  // Add edge lines for better visualization
  const edgeGeometry = new THREE.EdgesGeometry(foldGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  foldedPart.add(edges);
}

function createTrapezoidGeometry(height: number, width: number, depth: number): THREE.BufferGeometry {
  // Create a custom geometry for the folded part
  // Top width: width (at the page)
  // Bottom width: width (at the page)
  // Opens outward creating a trapezoid shape

  const geometry = new THREE.BufferGeometry();

  const halfHeight = height / 2;
  const halfWidth = width / 2;

  // Vertices for the trapezoid
  // The shape opens outward (in Z direction) but stays within bounds
  const vertices = new Float32Array([
    // Front face (at the page - narrow)
    -depth/2, -halfHeight, 0,     // 0: bottom left front
    -depth/2, halfHeight, 0,      // 1: top left front
    depth/2, halfHeight, 0,       // 2: top right front
    depth/2, -halfHeight, 0,      // 3: bottom right front

    // Back face (opens outward - wider)
    -depth/2, -halfHeight, depth, // 4: bottom left back
    -depth/2, halfHeight, depth,  // 5: top left back
    depth/2, halfHeight, depth,   // 6: top right back
    depth/2, -halfHeight, depth,  // 7: bottom right back
  ]);

  const indices = [
    // Front face
    0, 1, 2,  0, 2, 3,
    // Back face
    4, 6, 5,  4, 7, 6,
    // Top face
    1, 5, 6,  1, 6, 2,
    // Bottom face
    0, 3, 7,  0, 7, 4,
    // Left face
    0, 4, 5,  0, 5, 1,
    // Right face
    3, 2, 6,  3, 6, 7,
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
