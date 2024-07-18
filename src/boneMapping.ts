// L5, T12 is not used in unity

export type BoneMappingType = {
  prefix: string;
  bones: { [key: string]: string };
};
const BoneMapping: Record<string, BoneMappingType> = {
  'mixamo': {
    prefix: 'mixamorig',
    bones: {
      Pelvis: 'Hips',
      L5: 'Spine',
      L3: 'Spine1',
      T12: 'Spine2',
      T8: 'Spine2',
      Neck: 'Neck',
      Head: 'Head',
      'Right Shoulder': 'RightShoulder',
      'Right Upper Arm': 'RightArm',
      'Right Forearm': 'RightForeArm',
      'Right Hand': 'RightHand',
      'Left Shoulder': 'LeftShoulder',
      'Left Upper Arm': 'LeftArm',
      'Left Forearm': 'LeftForeArm',
      'Left Hand': 'LeftHand',
      'Right Upper Leg': 'RightUpLeg',
      'Right Lower Leg': 'RightLeg',
      'Right Foot': 'RightFoot',
      'Right Toe': 'RightToeBase',
      'Left Upper Leg': 'LeftUpLeg',
      'Left Lower Leg': 'LeftLeg',
      'Left Foot': 'LeftFoot',
      'Left Toe': 'LeftToeBase',
    },
  },
};

export default BoneMapping;
