import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PagePattern } from '../services/cutModes/cutAndFold.service';

interface BookPreview3DProps {
  pattern?: PagePattern[]; // Optional - for preview mode without pattern
  pageHeight: number; // in cm
  pageWidth?: number; // in cm, defaults to pageHeight / 1.5
  numberOfPages: number;
  bookDepth?: number; // in cm, thickness at spine
  cutDepth?: number; // in cm, depth of cuts from edge (default 1cm)
  unit?: 'cm' | 'in';
}

export const BookPreview3D: React.FC<BookPreview3DProps> = ({
  pattern,
  pageHeight,
  pageWidth,
  numberOfPages,
  bookDepth = 3,
  cutDepth = 1,
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
  const depthInCm = unit === 'in' ? bookDepth * 2.54 : bookDepth;
  const cutDepthInCm = unit === 'in' ? cutDepth * 2.54 : cutDepth;

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

    // Use fixed book depth
    const maxDimension = Math.max(heightInCm, widthInCm, depthInCm);

    // Position camera to view the book from front-right angle
    // Book orientation: Width (X), Height (Y), Depth/Thickness (Z)
    // Spine is on the left side (-X)
    camera.position.set(maxDimension * 1.5, maxDimension * 0.8, maxDimension * 2);
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
    createBook(scene, pattern, heightInCm, widthInCm, numberOfPages, depthInCm, cutDepthInCm);

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
  }, [pattern, heightInCm, widthInCm, numberOfPages, depthInCm]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    />
  );
};

function createBook(
  scene: THREE.Scene,
  pattern: PagePattern[] | undefined,
  pageHeight: number,
  pageWidth: number,
  numberOfPages: number,
  totalDepth: number,
  cutDepth: number
) {
  console.log('🔍 Book dimensions:', {
    'Width (X-axis)': pageWidth + 'cm',
    'Height (Y-axis)': pageHeight + 'cm',
    'Depth/Thickness (Z-axis)': totalDepth + 'cm',
    'Number of pages': numberOfPages
  });

  // Distribute pages evenly across the book depth
  const pageDepths = new Map<number, number>();
  for (let i = 0; i < numberOfPages; i++) {
    pageDepths.set(i, (i / numberOfPages) * totalDepth);
  }

  const coverThickness = 0.3;

  // Create book cover (back)
  const backCoverGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, coverThickness);
  const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c1810,
    roughness: 0.8,
    metalness: 0.2,
  });
  const backCover = new THREE.Mesh(backCoverGeometry, coverMaterial);
  backCover.position.z = -totalDepth / 2 - coverThickness / 2;
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  scene.add(backCover);

  // Create spine (reliure) - on the LEFT side of the book
  const spineGeometry = new THREE.BoxGeometry(0.5, pageHeight, totalDepth + coverThickness * 2);
  const spineMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0f08,
    roughness: 0.9,
    metalness: 0.1,
  });
  const spine = new THREE.Mesh(spineGeometry, spineMaterial);
  spine.position.set(-pageWidth / 2 - 0.25, 0, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  scene.add(spine);

  // Create pages with cut and fold patterns
  if (pattern && pattern.length > 0) {
    // If pattern exists, create pages with folds
    for (let i = 0; i < numberOfPages; i++) {
      const pagePattern = pattern.find(p => p.page === i + 1);
      // Reverse order: page 1 at front (+Z), last page at back (-Z)
      const zPosition = totalDepth / 2 - pageDepths.get(i)!;

      if (pagePattern && pagePattern.hasContent && pagePattern.zones.length > 0) {
        // Create page with fold zones
        createPageWithCutsAndFolds(scene, pagePattern, pageHeight, pageWidth, zPosition, cutDepth);
      } else {
        // Create regular flat page
        createFlatPage(scene, pageHeight, pageWidth, zPosition, 0.01);
      }
    }
  } else {
    // Preview mode: show all individual pages to visualize page count
    const pageThickness = totalDepth / numberOfPages;

    console.log('📄 Rendering pages:', {
      'Total pages': numberOfPages,
      'Page thickness': pageThickness.toFixed(4) + 'cm',
      'Total depth': totalDepth + 'cm'
    });

    const pageGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, pageThickness * 0.9);
    const pageMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f3,
      roughness: 0.9,
      metalness: 0.0,
    });

    // Render all pages for realistic preview
    for (let i = 0; i < numberOfPages; i++) {
      // Position based on uniform distribution across totalDepth
      const zPos = -totalDepth / 2 + (i / numberOfPages) * totalDepth + pageThickness / 2;

      const page = new THREE.Mesh(pageGeometry, pageMaterial);
      page.position.set(0, 0, zPos);
      page.castShadow = true;
      page.receiveShadow = true;
      scene.add(page);
    }
  }

  // Create book cover (front)
  const frontCoverGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, coverThickness);
  const frontCover = new THREE.Mesh(frontCoverGeometry, coverMaterial);
  frontCover.position.z = totalDepth / 2 + coverThickness / 2;
  frontCover.castShadow = true;
  frontCover.receiveShadow = true;
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
  zPosition: number,
  cutDepth: number
) {
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
    -cutDepth / 2, // Shift left to leave space on the right (outer edge)
    segmentCenterY,
    0
  );
  mainPart.castShadow = true;
  mainPart.receiveShadow = true;
  pageGroup.add(mainPart);

  // Create the folded part as a trapezoid opening outward
  // This creates the 3D "fan" effect shown in your diagram
  // Reduce fold depth to prevent overflow (use 20% of cutDepth)
  const foldGeometry = createTrapezoidGeometry(segmentHeight, cutDepth, cutDepth * 0.2);
  const foldedPart = new THREE.Mesh(foldGeometry, material);

  // Position at the outer edge (right side, opposite of spine)
  foldedPart.position.set(
    pageWidth / 2 - cutDepth / 2, // At the right edge (outer edge, opposite of spine)
    segmentCenterY,
    0 // Keep fold flush with page to prevent overflow
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
