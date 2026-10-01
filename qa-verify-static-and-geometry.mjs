import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOMS, OfficeMap } from './src/engine/OfficeMap.ts';
import { AGENT_CONFIGS, MEETING_SEATS } from './server/hermesAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_SHA256 = '12ede07c316392abd2741c921d98061a757858c74bd13660a4a044935f4cefa3';
const TARGET_PATH = path.resolve(__dirname, 'src/engine/OfficeMap.ts');

const results = [];

function check(testName, passed, details = {}) {
  results.push({ testName, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${testName}`);
  if (!passed) {
    console.error(`  DETAILS:`, details);
  }
}

// 1. SHA-256 Check
const fileBuffer = fs.readFileSync(TARGET_PATH);
const actualSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
check('1.1 File SHA-256 matches parent handoff', actualSha256 === EXPECTED_SHA256, {
  expected: EXPECTED_SHA256,
  actual: actualSha256
});

// 2. Exported Interfaces & Contracts
check('2.1 ROOMS array is exported and has 7 rooms', Array.isArray(ROOMS) && ROOMS.length === 7, {
  count: ROOMS.length
});

const EXPECTED_ROOM_IDS = [
  'manager', 'dev', 'research', 'meeting', 'qa_security', 'lounge', 'server_room'
];
const actualRoomIds = ROOMS.map(r => r.id);
check('2.2 ROOMS IDs match exact specification', 
  JSON.stringify(actualRoomIds) === JSON.stringify(EXPECTED_ROOM_IDS), {
    expected: EXPECTED_ROOM_IDS,
    actual: actualRoomIds
  }
);

for (const r of ROOMS) {
  const hasFields = typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.x === 'number' &&
    typeof r.y === 'number' &&
    typeof r.w === 'number' &&
    typeof r.h === 'number' &&
    typeof r.color === 'string' &&
    typeof r.accent === 'string';
  check(`2.3 RoomDef schema valid for room '${r.id}'`, hasFields, r);
}

const mapInstance = new OfficeMap();
check('2.4 OfficeMap class instance has render method', typeof mapInstance.render === 'function');
check('2.5 OfficeMap.render accepts 2 parameters', mapInstance.render.length <= 2);

// 3. Exact Geometry Bounds
const EXPECTED_ROOM_GEOMETRY = {
  manager: { x: 80, y: 70, w: 240, h: 170 },
  dev: { x: 350, y: 70, w: 290, h: 180 },
  research: { x: 670, y: 70, w: 290, h: 170 },
  meeting: { x: 370, y: 285, w: 250, h: 135 },
  qa_security: { x: 80, y: 350, w: 260, h: 250 },
  lounge: { x: 370, y: 440, w: 270, h: 165 },
  server_room: { x: 670, y: 350, w: 290, h: 250 }
};

const roomMap = new Map();
for (const r of ROOMS) {
  roomMap.set(r.id, r);
  const expected = EXPECTED_ROOM_GEOMETRY[r.id];
  const matches = expected &&
    r.x === expected.x &&
    r.y === expected.y &&
    r.w === expected.w &&
    r.h === expected.h;
  check(`3.1 Room geometry exact bounds for '${r.id}'`, !!matches, {
    expected,
    actual: { x: r.x, y: r.y, w: r.w, h: r.h }
  });
}

// 4. Agent Home Desk Containment
for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
  const room = roomMap.get(config.homeRoom);
  if (!room) {
    check(`4.1 Agent ${agentId} homeRoom '${config.homeRoom}' exists`, false);
    continue;
  }
  const desk = config.homeDesk;
  const inside = desk.x >= room.x && desk.x <= room.x + room.w &&
                 desk.y >= room.y && desk.y <= room.y + room.h;
  check(`4.2 Agent ${agentId} (${config.name}) desk inside ${config.homeRoom}`, inside, {
    desk,
    roomBounds: { x: room.x, y: room.y, x2: room.x + room.w, y2: room.y + room.h }
  });
}

// 5. Meeting Seats Containment
const meetingRoom = roomMap.get('meeting');
for (let i = 0; i < MEETING_SEATS.length; i++) {
  const seat = MEETING_SEATS[i];
  const inside = seat.x >= meetingRoom.x && seat.x <= meetingRoom.x + meetingRoom.w &&
                 seat.y >= meetingRoom.y && seat.y <= meetingRoom.y + meetingRoom.h;
  check(`5.1 Meeting seat #${i+1} (${seat.x}, ${seat.y}) inside meeting room`, inside, {
    seat,
    roomBounds: { x: meetingRoom.x, y: meetingRoom.y, x2: meetingRoom.x + meetingRoom.w, y2: meetingRoom.y + meetingRoom.h }
  });
}

// Summary
const total = results.length;
const passedCount = results.filter(r => r.passed).length;
const failedCount = total - passedCount;
console.log(`\n========================================`);
console.log(`STATIC & GEOMETRY VERIFICATION RESULT: ${failedCount === 0 ? 'ALL PASS' : 'FAILURES DETECTED'}`);
console.log(`Total: ${total} | Passed: ${passedCount} | Failed: ${failedCount}`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
}
