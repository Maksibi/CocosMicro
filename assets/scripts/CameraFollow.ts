import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

/** Unity analog: Cinemachine-style follow with a fixed offset */
@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property(Node)
    public target: Node | null = null;

    @property
    public followSpeed = 6;

    private readonly _offset = new Vec3(0, 9, -12);
    private readonly _lookAhead = new Vec3(0, 1.2, 4);
    private readonly _desired = new Vec3();
    private readonly _lookAt = new Vec3();

    lateUpdate(dt: number): void {
        if (!this.target) {
            return;
        }

        Vec3.add(this._desired, this.target.worldPosition, this._offset);
        this.node.setWorldPosition(this.node.worldPosition.lerp(this._desired, Math.min(1, this.followSpeed * dt)));

        Vec3.add(this._lookAt, this.target.worldPosition, this._lookAhead);
        this.node.lookAt(this._lookAt);
    }
}
