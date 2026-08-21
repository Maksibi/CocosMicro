import { _decorator, Component, Vec3, find } from 'cc';
import { Coin } from './Coin';
import { FinishZone } from './FinishZone';
import { Joystick } from './Joystick';

const { ccclass, property } = _decorator;

/** Unity analog: camera-relative CharacterController move on XZ */
@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    public moveSpeed = 7;

    public joystick: Joystick | null = null;
    public coins: Coin[] = [];
    public finishZones: FinishZone[] = [];
    public finished = false;
    public onCoinCollected: (() => void) | null = null;
    public onFinished: (() => void) | null = null;

    private _camera: Node | null = null;
    private readonly _move = new Vec3();
    private readonly _next = new Vec3();
    private readonly _fwd = new Vec3();
    private readonly _right = new Vec3();

    start(): void {
        this._camera = find('Main Camera');
        this._refreshLevelObjects();
    }

    public refreshLevelObjects(): void {
        this._refreshLevelObjects();
    }

    update(dt: number): void {
        if (this.finished || !this.joystick) {
            return;
        }

        const dir = this.joystick.direction;
        if (dir.lengthSqr() > 0.02) {
            this._cameraRelativeMove(dir.x, dir.y);
            this._move.normalize().multiplyScalar(this.moveSpeed * dt);
            Vec3.add(this._next, this.node.position, this._move);
            this.node.setPosition(this._next);

            const yaw = Math.atan2(this._move.x, this._move.z) * 180 / Math.PI;
            this.node.setRotationFromEuler(0, yaw, 0);
        }

        const pos = this.node.worldPosition;
        for (let i = 0; i < this.coins.length; i++) {
            if (this.coins[i].tryCollect(pos)) {
                this.onCoinCollected?.();
            }
        }

        for (let i = 0; i < this.finishZones.length; i++) {
            const zone = this.finishZones[i];
            if (!zone.node.activeInHierarchy) {
                continue;
            }
            if (Vec3.distance(pos, zone.node.worldPosition) <= zone.radius) {
                this.finished = true;
                this.onFinished?.();
                break;
            }
        }
    }

    private _refreshLevelObjects(): void {
        const scene = this.node.scene;
        if (!scene) {
            return;
        }
        this.coins = scene.getComponentsInChildren(Coin);
        this.finishZones = scene.getComponentsInChildren(FinishZone);
    }

    private _cameraRelativeMove(x: number, y: number): void {
        if (this._camera) {
            this._fwd.set(this._camera.forward);
            this._fwd.y = 0;
            if (this._fwd.lengthSqr() < 0.0001) {
                this._fwd.set(0, 0, 1);
            } else {
                this._fwd.normalize();
            }

            this._right.set(this._camera.right);
            this._right.y = 0;
            if (this._right.lengthSqr() < 0.0001) {
                this._right.set(1, 0, 0);
            } else {
                this._right.normalize();
            }

            Vec3.multiplyScalar(this._move, this._right, x);
            Vec3.scaleAndAdd(this._move, this._move, this._fwd, y);
            return;
        }

        this._move.set(-x, 0, y);
    }
}
