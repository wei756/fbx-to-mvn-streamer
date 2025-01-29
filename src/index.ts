import { MVNStreamer } from './mvn-streamer.ts';
import { MotionLoader } from './motion-loader.ts';
import BoneMapping from './boneMapping.ts';

const fbxName = 'src/Capoeira.fbx';
const boneMappingPreset = 'mixamo';

const streamer = new MVNStreamer('localhost', 9763);

const motionLoader = new MotionLoader(
  fbxName,
  60,
  BoneMapping[boneMappingPreset],
  120
);

(async () => {
  await motionLoader.load();
  console.log('isAnimationReady', motionLoader.isAnimationReady());

  let timeCode = 0;
  setInterval(() => {
    streamer.sendTimecode(Math.floor(timeCode * motionLoader.deltaTime * 1000));
    const segments = motionLoader.getCurrentFrame();
    streamer.sendQuaternionPose({
      timeCode,
      characterId: 0,
      bodySegments: segments.splice(0, 23),
      fingerTrackingDataSegments: segments,
    });
    timeCode++;
    motionLoader.moveNextFrame();
    // console.timeEnd('timeCode');
  }, Math.floor(motionLoader.deltaTime * 1000) - 1);
})();
