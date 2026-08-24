import { Color, Node, Prefab, Vec3, instantiate } from 'cc';
import { Coin } from './Coin';
import { FinishZone } from './FinishZone';
import { tintMesh } from './PrimitiveUtil';

export interface LevelPrefabs {
    ground: Prefab;
    wall: Prefab;
    obstacle: Prefab;
    coin: Prefab;
    finish: Prefab;
}

export interface BuiltLevel {
    coins: Coin[];
    coinTotal: number;
    finishZones: FinishZone[];
    startPos: Vec3;
}

interface PathPoint {
    pos: Vec3;
    tangent: Vec3;
    yaw: number;
}

interface ObstacleFootprint {
    x: number;
    z: number;
    yawDeg: number;
    halfX: number;
    halfZ: number;
}

const TRACK_WIDTH = 12;
const HALF_WIDTH = TRACK_WIDTH * 0.5;
const SEGMENT_LEN = 5;
const PATH_LENGTH = 160;
const COIN_RADIUS = 0.55;

const COLOR_GROUND = new Color(76, 140, 78, 255);
const COLOR_WALL = new Color(58, 58, 62, 255);
const COLOR_OBSTACLE = new Color(92, 96, 110, 255);
const COLOR_FINISH = new Color(40, 190, 220, 255);

/** Long winding runway built from serialized prefab references. */
export function buildLevel(root: Node, prefabs: LevelPrefabs): BuiltLevel {
    const path = buildWindingPath();
    const obstacles: ObstacleFootprint[] = [];

    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const mid = new Vec3(
            (a.pos.x + b.pos.x) * 0.5,
            -0.5,
            (a.pos.z + b.pos.z) * 0.5,
        );
        const len = Vec3.distance(a.pos, b.pos) + 0.35;
        const yaw = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z) * 180 / Math.PI;

        spawnPiece(prefabs.ground, root, `Ground${i}`, mid, new Vec3(TRACK_WIDTH, 1, len), yaw, COLOR_GROUND);

        const right = new Vec3(Math.cos(yaw * Math.PI / 180), 0, -Math.sin(yaw * Math.PI / 180));
        spawnPiece(
            prefabs.wall,
            root,
            `WallL${i}`,
            new Vec3(mid.x - right.x * (HALF_WIDTH + 0.3), 1.1, mid.z - right.z * (HALF_WIDTH + 0.3)),
            new Vec3(0.55, 2.4, len),
            yaw,
            COLOR_WALL,
        );
        spawnPiece(
            prefabs.wall,
            root,
            `WallR${i}`,
            new Vec3(mid.x + right.x * (HALF_WIDTH + 0.3), 1.1, mid.z + right.z * (HALF_WIDTH + 0.3)),
            new Vec3(0.55, 2.4, len),
            yaw,
            COLOR_WALL,
        );
    }

    for (let i = 4; i < path.length - 4; i += 3) {
        const p = path[i];
        const side = (i % 2 === 0) ? 1 : -1;
        const lateral = side * (HALF_WIDTH * 0.35);
        const right = new Vec3(Math.cos(p.yaw * Math.PI / 180), 0, -Math.sin(p.yaw * Math.PI / 180));
        const sx = 2.4 + (i % 3) * 0.4;
        const sz = 1.6;
        const pos = new Vec3(p.pos.x + right.x * lateral, 0.9, p.pos.z + right.z * lateral);
        spawnPiece(prefabs.obstacle, root, `Obstacle${i}`, pos, new Vec3(sx, 1.8, sz), p.yaw, COLOR_OBSTACLE);
        obstacles.push({
            x: pos.x,
            z: pos.z,
            yawDeg: p.yaw,
            halfX: sx * 0.5,
            halfZ: sz * 0.5,
        });
    }

    const coins: Coin[] = [];
    const coinOffsets = [0, -2.4, 2.4, -1.2, 1.2, 0, 3.0, -3.0];
    for (let i = 2; i < path.length - 2; i++) {
        if (i % 2 !== 0) {
            continue;
        }
        const p = path[i];
        const right = new Vec3(Math.cos(p.yaw * Math.PI / 180), 0, -Math.sin(p.yaw * Math.PI / 180));

        let placed = false;
        for (let o = 0; o < coinOffsets.length; o++) {
            const offset = coinOffsets[(i + o) % coinOffsets.length];
            const coinPos = new Vec3(p.pos.x + right.x * offset, 0.75, p.pos.z + right.z * offset);
            if (overlapsObstacle(coinPos.x, coinPos.z, COIN_RADIUS, obstacles)) {
                continue;
            }
            coins.push(spawnCoin(prefabs.coin, root, `Coin${i}`, coinPos));
            placed = true;
            break;
        }
        if (!placed) {
            const fallback = new Vec3(p.pos.x, 0.75, p.pos.z);
            if (!overlapsObstacle(fallback.x, fallback.z, COIN_RADIUS, obstacles)) {
                coins.push(spawnCoin(prefabs.coin, root, `Coin${i}`, fallback));
            }
        }
    }

    const end = path[path.length - 1];
    const endRight = new Vec3(Math.cos(end.yaw * Math.PI / 180), 0, -Math.sin(end.yaw * Math.PI / 180));
    spawnPiece(prefabs.wall, root, 'FinishL',
        new Vec3(end.pos.x - endRight.x * 4, 1.6, end.pos.z - endRight.z * 4),
        new Vec3(0.6, 3.2, 0.6), end.yaw, COLOR_FINISH);
    spawnPiece(prefabs.wall, root, 'FinishR',
        new Vec3(end.pos.x + endRight.x * 4, 1.6, end.pos.z + endRight.z * 4),
        new Vec3(0.6, 3.2, 0.6), end.yaw, COLOR_FINISH);
    spawnPiece(prefabs.obstacle, root, 'FinishBar',
        new Vec3(end.pos.x, 3.1, end.pos.z),
        new Vec3(9, 0.4, 0.6), end.yaw, COLOR_FINISH);
    spawnPiece(prefabs.ground, root, 'FinishPad',
        new Vec3(end.pos.x + end.tangent.x * 1.5, 0.05, end.pos.z + end.tangent.z * 1.5),
        new Vec3(8.4, 0.1, 3.2), end.yaw, new Color(30, 150, 180, 180));

    const finishNode = instantiate(prefabs.finish);
    finishNode.name = 'Finish';
    root.addChild(finishNode);
    finishNode.setPosition(end.pos.x, 1, end.pos.z);
    let finishZone = finishNode.getComponent(FinishZone);
    if (!finishZone) {
        finishZone = finishNode.addComponent(FinishZone);
    }
    finishZone.radius = 3.2;

    const start = path[0].pos;
    return {
        coins,
        coinTotal: coins.length,
        finishZones: [finishZone],
        startPos: new Vec3(start.x, 1, start.z),
    };
}

function spawnPiece(
    prefab: Prefab,
    parent: Node,
    name: string,
    position: Vec3,
    scale: Vec3,
    yawDeg: number,
    color: Color,
): Node {
    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(position);
    node.setScale(scale);
    node.setRotationFromEuler(0, yawDeg, 0);
    tintMesh(node, color);
    return node;
}

function spawnCoin(prefab: Prefab, parent: Node, name: string, position: Vec3): Coin {
    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(position);
    node.setScale(0.7, 0.7, 0.7);
    let coin = node.getComponent(Coin);
    if (!coin) {
        coin = node.addComponent(Coin);
    }
    return coin;
}

function overlapsObstacle(x: number, z: number, radius: number, obstacles: ObstacleFootprint[]): boolean {
    for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const rad = -o.yawDeg * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const dx = x - o.x;
        const dz = z - o.z;
        const lx = dx * c - dz * s;
        const lz = dx * s + dz * c;
        if (Math.abs(lx) <= o.halfX && Math.abs(lz) <= o.halfZ) {
            return true;
        }
        const cx = Math.max(-o.halfX, Math.min(o.halfX, lx));
        const cz = Math.max(-o.halfZ, Math.min(o.halfZ, lz));
        const ox = lx - cx;
        const oz = lz - cz;
        if (ox * ox + oz * oz < radius * radius) {
            return true;
        }
    }
    return false;
}

function buildWindingPath(): PathPoint[] {
    const points: PathPoint[] = [];
    const steps = Math.ceil(PATH_LENGTH / SEGMENT_LEN);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const z = t * PATH_LENGTH;
        const x =
            Math.sin(t * Math.PI * 2.2) * 18 +
            Math.sin(t * Math.PI * 4.6 + 0.8) * 7 +
            Math.sin(t * Math.PI * 1.1) * 5;

        points.push({
            pos: new Vec3(x, 0, z),
            tangent: new Vec3(0, 0, 1),
            yaw: 0,
        });
    }

    for (let i = 0; i < points.length; i++) {
        const prev = points[Math.max(0, i - 1)].pos;
        const next = points[Math.min(points.length - 1, i + 1)].pos;
        const tangent = new Vec3(next.x - prev.x, 0, next.z - prev.z);
        if (tangent.lengthSqr() < 0.0001) {
            tangent.set(0, 0, 1);
        } else {
            tangent.normalize();
        }
        points[i].tangent = tangent;
        points[i].yaw = Math.atan2(tangent.x, tangent.z) * 180 / Math.PI;
    }

    return points;
}
