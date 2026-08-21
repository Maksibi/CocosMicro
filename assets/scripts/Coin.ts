import { _decorator, Color, Component, Vec3 } from 'cc';
import { tintMesh } from './PrimitiveUtil';

const { ccclass, property } = _decorator;

/** Put this on any node you place in the scene. The game counts all of them at start. */
@ccclass('Coin')
export class Coin extends Component {
    @property
    public collectRadius = 1.4;

    public collected = false;

    onLoad(): void {
        tintMesh(this.node, new Color(255, 196, 37, 255));
    }

    update(dt: number): void {
        if (this.collected) {
            return;
        }
        const euler = this.node.eulerAngles;
        this.node.setRotationFromEuler(0, euler.y + 180 * dt, 0);
    }

    public tryCollect(playerPos: Vec3): boolean {
        if (this.collected || !this.node.activeInHierarchy) {
            return false;
        }
        if (Vec3.distance(this.node.worldPosition, playerPos) > this.collectRadius) {
            return false;
        }

        this.collected = true;
        this.node.active = false;
        return true;
    }
}
