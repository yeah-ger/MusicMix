import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSessionStore } from '../stores/sessionStore';
import { useAppStore } from '../stores/appStore';
import type { WorldState, SpectrumData } from '../types';

interface ParticleSystemProps {
  count: number;
  worldState: WorldState;
  spectrum: SpectrumData;
  paused: boolean;
}

function ParticleSystem({ count, worldState, spectrum, paused }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, phases: ph };
  }, [count]);

  useFrame((_, delta) => {
    if (paused || !meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const speed = worldState.motionSpeed;
    const turb = worldState.turbulence;
    const density = worldState.particleDensity;
    const lowPulse = 1 + spectrum.low * 0.5;
    const highFlicker = spectrum.high;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i3] * speed * 60 * delta;
      positions[i3 + 1] += velocities[i3 + 1] * speed * 60 * delta;
      positions[i3 + 2] += velocities[i3 + 2] * speed * 60 * delta;
      positions[i3] += Math.sin(t * 0.5 + phases[i]) * turb * 0.01;
      positions[i3 + 1] += Math.cos(t * 0.3 + phases[i] * 1.3) * turb * 0.01;

      for (let j = 0; j < 3; j++) {
        if (Math.abs(positions[i3 + j]) > 5 * density + 3) {
          positions[i3 + j] *= -0.8;
          velocities[i3 + j] *= -1;
        }
      }

      const pulseFactor = lowPulse * (1 + Math.sin(spectrum.beatPhase * Math.PI * 2) * 0.1);
      const scale = (0.02 + density * 0.03) * pulseFactor;

      dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      dummy.scale.setScalar(scale + (i % 3 === 0 ? highFlicker * 0.02 : 0));
      dummy.rotation.y = t * 0.1 + phases[i];
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const color = useMemo(() => {
    const c = new THREE.Color();
    c.setHSL(worldState.hue, Math.max(0.3, worldState.saturation), Math.max(0.4, worldState.brightness));
    return c;
  }, [worldState.hue, worldState.saturation, worldState.brightness]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </instancedMesh>
  );
}

function VoidParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 50;
  const timeRef = useRef(0);

  const { phases, positions } = useMemo(() => {
    const ph = new Float32Array(count);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      ph[i] = Math.random() * Math.PI * 2;
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return { phases: ph, positions: pos };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const breath = 0.5 + 0.5 * Math.sin(t * 0.8 + phases[i]);
      dummy.position.set(
        positions[i3] + Math.sin(t * 0.2 + phases[i]) * 0.3,
        positions[i3 + 1] + Math.cos(t * 0.15 + phases[i]) * 0.3,
        positions[i3 + 2],
      );
      dummy.scale.setScalar(0.02 + breath * 0.03);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.4} />
    </instancedMesh>
  );
}

export function VisualizerScene() {
  const worldState = useSessionStore((s) => s.worldState);
  const spectrum = useSessionStore((s) => s.spectrum);
  const playbackState = useSessionStore((s) => s.playbackState);
  const phase = useAppStore((s) => s.phase);
  const isVoid = phase === 'void';
  const paused = playbackState === 'paused';
  const particleCount = Math.max(500, Math.floor(worldState.particleDensity * 3000 + 1000));

  return (
    <>
      <ambientLight intensity={0.1} />
      {isVoid ? (
        <VoidParticles />
      ) : (
        <ParticleSystem count={particleCount} worldState={worldState} spectrum={spectrum} paused={paused} />
      )}
    </>
  );
}
