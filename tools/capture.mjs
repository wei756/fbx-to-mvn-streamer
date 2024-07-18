// udp-capture.mjs
import { createSocket } from 'dgram';
import { appendFile } from 'fs/promises';

// UDP 소켓 생성
const socket = createSocket('udp4');
const PORT = 9763;

// 파일에 데이터를 추가하는 함수
async function appendToFile(data) {
  try {
    await appendFile('udp_capture.txt', data);
  } catch (err) {
    console.error('Error writing to file', err);
  }
}

// UDP 메시지 수신 시 처리하는 함수
socket.on('message', (msg, rinfo) => {
  const timestamp = new Date().toISOString();
  const hexString = msg.toString('hex');
  const logEntry = `${timestamp} ${msg.toString()}\n`;

  // console.log(logEntry); // 콘솔에 출력
  appendToFile(logEntry); // 파일에 저장
});

// 에러 처리
socket.on('error', (err) => {
  console.error(`Socket error:\n${err.stack}`);
  socket.close();
});

// 소켓 바인딩
socket.bind(PORT, () => {
  console.log(`UDP socket listening on port ${PORT}`);
});