import fs from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { BoneMappingType } from './boneMapping.ts';
import { PoseSegment } from './mvn-streamer.ts';

export class MotionLoader {
  readonly filename: string;
  readonly boneMapping: BoneMappingType;
  readonly fps: number;
  readonly deltaTime: number;
  readonly worldScale: number;

  skeletonHelper: THREE.SkeletonHelper | null = null;
  animation: THREE.AnimationClip | null = null;
  mixer: THREE.AnimationMixer | null = null;
  action: THREE.AnimationAction | null = null;
  readonly Tpose: Record<string, THREE.Quaternion> = {};

  constructor(
    filename: string,
    fps: number,
    boneMapping: BoneMappingType,
    worldScale = 100
  ) {
    this.filename = filename;
    this.boneMapping = boneMapping;
    this.fps = fps;
    this.deltaTime = 1 / this.fps;
    this.worldScale = worldScale;
  }

  async load() {
    const file = fs.readFileSync(this.filename).buffer;
    const fbx = new FBXLoader().parse(file, '');

    this.skeletonHelper = new THREE.SkeletonHelper(fbx);

    this.mixer = new THREE.AnimationMixer(fbx);
    this.animation = fbx.animations[0];
    this.action = this.mixer.clipAction(this.animation);
    this.action.play();

    this.generateTPose();
  }

  generateTPose() {
    if (!this.skeletonHelper) {
      return;
    }
    Object.entries(this.boneMapping.bones).forEach(([key, origBone]) => {
      const bone = this.skeletonHelper!.bones.find(
        (bone) => bone.name === this.boneMapping.prefix + origBone
      )!;
      console.log(
        key,
        origBone,
        bone.rotation.order,
        ((bone.rotation.x / Math.PI) * 180).toFixed(1),
        ((bone.rotation.y / Math.PI) * 180).toFixed(1),
        ((bone.rotation.z / Math.PI) * 180).toFixed(1)
      );

      bone.updateMatrixWorld(true); // 관절의 월드 변환 행렬 갱신

      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();

      bone.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
      const rotation = worldQuaternion;

      // 좌우 반전
      worldQuaternion.z = -worldQuaternion.z;
      worldQuaternion.y = -worldQuaternion.y;

      this.Tpose[key] = rotation;
    });
  }

  isAnimationReady() {
    return !!(this.mixer && this.skeletonHelper && this.animation && this.action);
  }

  moveNextFrame() {
    if (!this.isAnimationReady()) {
      return;
    }

    // update mixer
    this.mixer!.update(this.deltaTime);

    const bones = this.skeletonHelper!.bones;

    Object.entries(this.boneMapping.bones).map(([key, origBone]) => {
      const bone = bones.find(
        (bone) => bone.name === this.boneMapping.prefix + origBone
      )!;

      bone.updateMatrixWorld(true); // 관절의 월드 변환 행렬 갱신
    });
  }

  getCurrentFrame(): PoseSegment[] {
    if (!this.isAnimationReady()) {
      return [];
    }

    const bones = this.skeletonHelper!.bones;

    return Object.entries(this.boneMapping.bones).map(([key, value]) => {
      const bone = bones.find(
        (bone) => bone.name === this.boneMapping.prefix + value
      )!;

      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();

      // 월드 변환 행렬을 위치, 회전, 스케일로 분해
      bone.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

      // yz평면 대칭
      worldQuaternion.z = -worldQuaternion.z;
      worldQuaternion.y = -worldQuaternion.y;

      const rotation = worldQuaternion.multiply(
        this.Tpose[key].clone().invert()
      );

      const position =
        key === 'Pelvis'
          ? [
              worldPosition.z / this.worldScale,
              worldPosition.x / this.worldScale,
              worldPosition.y / this.worldScale,
            ]
          : [0, 0, 0];

      return {
        id: key,
        position: position,
        rotation: [rotation.w, -rotation.z, rotation.x, -rotation.y],
      } as PoseSegment;
    });
  }
}
