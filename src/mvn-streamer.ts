import dgram from 'dgram';
import { Buffer } from 'buffer';

export type PoseQuaternionPayload = {
  timeCode: number;
  characterId: number;
  bodySegments: PoseSegment[];
  fingerTrackingDataSegments: PoseSegment[];
};

export type PoseSegment = {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
};

export class MVNStreamer {
  static MSG_PREFIX = [0x4d, 0x58, 0x54, 0x50]; // MXTP

  static MSG_POSE_EULER = [0x30, 0x31]; // 01
  static MSG_POSE_QUATERNION = [0x30, 0x32]; // 02
  static MSG_POSE_POSITION_ONLY = [0x30, 0x33]; // 03
  static MSG_POSE_UNITY_LEGACY = [0x30, 0x35]; // 05
  static MSG_CHARACTER_META_DATA = [0x31, 0x32]; // 12
  static MSG_CHARACTER_SCALE = [0x31, 0x33]; // 13
  static MSG_TIME_CODE = [0x32, 0x35]; // 25

  static BODY_SEGMENTS = [
    'Pelvis',
    'L5',
    'L3',
    'T12',
    'T8',
    'Neck',
    'Head',
    'Right Shoulder',
    'Right Upper Arm',
    'Right Forearm',
    'Right Hand',
    'Left Shoulder',
    'Left Upper Arm',
    'Left Forearm',
    'Left Hand',
    'Right Upper Leg',
    'Right Lower Leg',
    'Right Foot',
    'Right Toe',
    'Left Upper Leg',
    'Left Lower Leg',
    'Left Foot',
    'Left Toe',
  ];

  ipAddr = 'localhost';
  port = 9763;
  readonly client: dgram.Socket | null = null;

  sampleCounter = 0;

  constructor(ipAddr = 'localhost', port = 9763) {
    this.ipAddr = ipAddr;
    this.port = port;
    this.client = dgram.createSocket('udp4');
  }

  send(message: Buffer) {
    this.client?.send(message, this.port, this.ipAddr, (err) => {
      // error handling
    });
  }

  close() {
    this.client?.close();
  }

  convertInt32ToBytes(value: number): [number, number, number, number] {
    return [
      (value & 0xff000000) >> 24,
      (value & 0x00ff0000) >> 16,
      (value & 0x0000ff00) >> 8,
      value & 0x000000ff,
    ];
  }

  convertInt16ToBytes(value: number): [number, number] {
    return [(value & 0xff00) >> 8, value & 0x00ff];
  }

  convertFloat32ToBytes(value: number): [number, number, number, number] {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false);
    return Array.from(new Uint8Array(buffer)) as [
      number,
      number,
      number,
      number
    ];
  }

  sendQuaternionPose(payload: PoseQuaternionPayload) {
    const header = [
      ...MVNStreamer.MSG_PREFIX,
      ...MVNStreamer.MSG_POSE_QUATERNION,
      ...this.convertInt32ToBytes(this.sampleCounter),
      0x80, // datagram counter
      payload.bodySegments.length + payload.fingerTrackingDataSegments.length,
      ...this.convertInt32ToBytes(payload.timeCode),
      payload.characterId,
      payload.bodySegments.length,
      0x00, // Number of props
      payload.fingerTrackingDataSegments.length,
      0x00,
      0x00, // Reserved bytes for future use
      ...this.convertInt16ToBytes(
        (payload.bodySegments.length +
          payload.fingerTrackingDataSegments.length) *
          32
      ),
    ];

    const payloadArray = payload.bodySegments.flatMap((segment) => [
      ...this.convertInt32ToBytes(
        MVNStreamer.BODY_SEGMENTS.indexOf(segment.id)
      ),
      ...segment.position.flatMap((v) => this.convertFloat32ToBytes(v)),
      ...segment.rotation.flatMap((v) => this.convertFloat32ToBytes(v)),
    ]);
    const message = Buffer.from([...header, ...payloadArray]);
    this.send(message);
    this.sampleCounter++;
  }

  sendTimecode(time: number) {
    const header = [
      ...MVNStreamer.MSG_PREFIX,
      ...MVNStreamer.MSG_TIME_CODE,
      ...this.convertInt32ToBytes(this.sampleCounter),
      0x80, // datagram counter
      0x00, // Number of items (23)
      ...this.convertInt32ToBytes(time),
      0x00, // Character ID
      0x00, // Number of body segments (23)
      0x00, // Number of props
      0x00, // Number of finger tracking data segments
      0x00,
      0x00, // Reserved bytes for future use
      0x00,
      0x0c, // Payload Size
      0x00,
      0x00,
      0x00,
      0x00, // unity package 버그인듯?
    ];

    const time_ = ('00000000' + time).slice(-9);
    // console.log("time: ", time_, time_.slice(0, 2) +
    // ':' +
    // time_.slice(2, 4) +
    // ':' +
    // time_.slice(4, 6) +
    // '.' +
    // time_.slice(6, 9))

    //'00:00:00.000'
    const payload = Buffer.from(
      time_.slice(0, 2) +
        ':' +
        time_.slice(2, 4) +
        ':' +
        time_.slice(4, 6) +
        '.' +
        time_.slice(6, 9),
      'utf-8'
    );

    const message = Buffer.from(header.concat(Array.from(payload)));
    // console.log(message);
    this.send(message);
  }
}
