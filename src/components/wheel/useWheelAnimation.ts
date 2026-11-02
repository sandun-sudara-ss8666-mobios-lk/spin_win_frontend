import { useState, useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { audioEngine } from './AudioEngine';

interface SpinAnimationConfig {
  sliceCount: number;
  targetSliceIndex: number;
  onComplete?: () => void;
}

export function useWheelAnimation() {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const currentRotationRef = useRef<number>(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  useEffect(() => {
    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, []);

  const spinTo = useCallback(
    ({ sliceCount, targetSliceIndex, onComplete }: SpinAnimationConfig) => {
      if (isSpinning) return;
      setIsSpinning(true);

      const anglePerSlice = 360 / Math.max(1, sliceCount);
      // Target angle so slice targetSliceIndex lands at the top pointer (0 deg / 12 o'clock)
      const targetAngleInCircle = (360 - targetSliceIndex * anglePerSlice) % 360;

      // Current normalized angle
      const currentAngle = currentRotationRef.current;
      const currentNormalized = currentAngle % 360;

      // Full dramatic rotations (5 full rotations = 1800 deg)
      const baseSpins = 5 * 360;
      let angleDelta = targetAngleInCircle - currentNormalized;
      if (angleDelta < 0) {
        angleDelta += 360;
      }

      const finalRotation = currentAngle + baseSpins + angleDelta;

      // Detect reduced-motion preference
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const duration = prefersReducedMotion ? 1.5 : 6.2;
      lastTickIndexRef.current = -1;

      tweenRef.current = gsap.to(currentRotationRef, {
        current: finalRotation,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          const currentRot = currentRotationRef.current;
          setRotation(currentRot);

          // Audio tick on each slice boundary
          const currentSliceFloat = (currentRot / anglePerSlice) % sliceCount;
          const currentSliceBoundary = Math.floor(currentSliceFloat);
          if (currentSliceBoundary !== lastTickIndexRef.current) {
            lastTickIndexRef.current = currentSliceBoundary;
            audioEngine.playTick(0.2);
          }
        },
        onComplete: () => {
          setIsSpinning(false);
          setRotation(finalRotation);
          currentRotationRef.current = finalRotation;
          onComplete?.();
        },
      });
    },
    [isSpinning],
  );

  const resetRotation = useCallback((angle = 0) => {
    if (tweenRef.current) {
      tweenRef.current.kill();
    }
    currentRotationRef.current = angle;
    setRotation(angle);
    setIsSpinning(false);
  }, []);

  return {
    rotation,
    isSpinning,
    spinTo,
    resetRotation,
  };
}
