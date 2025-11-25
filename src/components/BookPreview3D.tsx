import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export interface PatternData {
    pageNumber: number
    topFold: number // Depth of top fold in mm (0-pageHeight/2)
    bottomFold: number // Depth of bottom fold in mm (0-pageHeight/2)
    isCut?: boolean // Whether the page is cut (cut & fold mode)
}

interface BookPreview3DProps {
    pattern: PatternData[]
    pageHeight: number // in mm
    pageWidth?: number // in mm (default 148mm for A5)
    bookThickness?: number // in mm
}

// Individual page component
function Page({
    position,
    topFold,
    bottomFold,
    pageHeight,
    pageWidth,
    isCut = false
}: {
    position: [number, number, number]
    topFold: number
    bottomFold: number
    pageHeight: number
    pageWidth: number
    isCut?: boolean
}) {
    const geometry = useMemo(() => {
        const segments = 20
        const geo = new THREE.PlaneGeometry(pageWidth, pageHeight, 1, segments)
        const positions = geo.attributes.position

        // Modify the geometry to create the fold effect
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i)
            const x = positions.getX(i)

            // Calculate fold depth based on Y position
            let foldDepth = 0

            if (y > 0) {
                // Top half - apply top fold
                const normalizedY = y / (pageHeight / 2)
                foldDepth = topFold * normalizedY * normalizedY // Quadratic curve for smooth fold
            } else {
                // Bottom half - apply bottom fold
                const normalizedY = Math.abs(y) / (pageHeight / 2)
                foldDepth = bottomFold * normalizedY * normalizedY
            }

            // If cut mode, create a sharper fold
            if (isCut) {
                foldDepth *= 1.5
            }

            positions.setZ(i, foldDepth)
        }

        positions.needsUpdate = true
        geo.computeVertexNormals()

        return geo
    }, [topFold, bottomFold, pageHeight, pageWidth, isCut])

    return (
        <mesh position={position} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
                color="#f5f5dc"
                side={THREE.DoubleSide}
                roughness={0.8}
                metalness={0.1}
            />
        </mesh>
    )
}

// Main book component
function Book({ pattern, pageHeight, pageWidth, bookThickness }: BookPreview3DProps) {
    const pages = useMemo(() => {
        return pattern.map((page, index) => {
            // Position each page slightly offset to create book thickness
            const zPosition = (index - pattern.length / 2) * 0.1

            return (
                <Page
                    key={index}
                    position={[0, 0, zPosition]}
                    topFold={page.topFold}
                    bottomFold={page.bottomFold}
                    pageHeight={pageHeight}
                    pageWidth={pageWidth}
                    isCut={page.isCut}
                />
            )
        })
    }, [pattern, pageHeight, pageWidth])

    return (
        <group rotation={[0, 0, 0]}>
            {pages}
            {/* Book cover (front) */}
            <mesh position={[0, 0, (pattern.length * 0.1) / 2 + 0.5]} receiveShadow>
                <planeGeometry args={[pageWidth, pageHeight]} />
                <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
            {/* Book cover (back) */}
            <mesh position={[0, 0, -(pattern.length * 0.1) / 2 - 0.5]} receiveShadow>
                <planeGeometry args={[pageWidth, pageHeight]} />
                <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
        </group>
    )
}

export default function BookPreview3D({
    pattern,
    pageHeight,
    pageWidth = 148,
    bookThickness = 20
}: BookPreview3DProps) {
    return (
        <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[300, 200, 300]} fov={50} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={200}
                    maxDistance={800}
                />

                {/* Lights */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />

                {/* Book */}
                <Book
                    pattern={pattern}
                    pageHeight={pageHeight}
                    pageWidth={pageWidth}
                    bookThickness={bookThickness}
                />

                {/* Ground plane for shadow */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -pageHeight / 2 - 10, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[1000, 1000]} />
                    <shadowMaterial opacity={0.2} />
                </mesh>
            </Canvas>
        </div>
    )
}
