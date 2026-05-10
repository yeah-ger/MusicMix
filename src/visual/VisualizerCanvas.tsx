import { Canvas } from '@react-three/fiber';
import { VisualizerScene } from './ParticleSystem';

export default function VisualizerCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true, alpha: true }}>
      <VisualizerScene />
    </Canvas>
  );
}
