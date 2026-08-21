import { _decorator, Component, EventKeyboard, EventTouch, Input, KeyCode, Node, Vec2, Vec3, input, view } from 'cc';

const { ccclass, property } = _decorator;

/** Unity analog: on-screen stick + Input.GetAxis */
@ccclass('Joystick')
export class Joystick extends Component {
    @property(Node)
    public knob: Node | null = null;

    public readonly direction = new Vec2();

    private readonly _keys = new Vec2();
    private readonly _offset = new Vec2();
    private readonly _uiPos = new Vec2();
    private readonly _world = new Vec3();
    private _radius = 90;
    private _hitRadius = 140;
    private _touchId: number | null = null;

    onLoad(): void {
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    private _onTouchStart(event: EventTouch): void {
        if (this._touchId !== null) {
            return;
        }
        this._uiToOffset(event, this._offset);
        if (this._offset.length() > this._hitRadius) {
            return;
        }
        this._touchId = event.getID();
        this._applyOffset();
    }

    private _onTouchMove(event: EventTouch): void {
        if (event.getID() !== this._touchId) {
            return;
        }
        this._uiToOffset(event, this._offset);
        this._applyOffset();
    }

    private _onTouchEnd(event: EventTouch): void {
        if (event.getID() !== this._touchId) {
            return;
        }
        this._touchId = null;
        this._resetKnob();
    }

    /** UI-координаты (0,0 слева снизу) → смещение от центра стика. */
    private _uiToOffset(event: EventTouch, out: Vec2): void {
        event.getUILocation(this._uiPos);
        this.node.getWorldPosition(this._world);
        const size = view.getVisibleSize();
        out.set(
            this._uiPos.x - (this._world.x + size.width * 0.5),
            this._uiPos.y - (this._world.y + size.height * 0.5),
        );
    }

    private _applyOffset(): void {
        const length = this._offset.length();
        if (length > this._radius) {
            this._offset.multiplyScalar(this._radius / length);
        }

        this.knob?.setPosition(this._offset.x, this._offset.y, 0);
        this.direction.set(this._offset.x / this._radius, this._offset.y / this._radius);
        this._mergeKeys();
    }

    private _resetKnob(): void {
        this.knob?.setPosition(0, 0, 0);
        this.direction.set(0, 0);
        this._mergeKeys();
    }

    private _mergeKeys(): void {
        if (this._keys.lengthSqr() <= 0.01) {
            return;
        }
        this.direction.set(this._keys);
        if (this.direction.lengthSqr() > 1) {
            this.direction.normalize();
        }
    }

    private _onKeyDown(event: EventKeyboard): void {
        this._setKey(event.keyCode, 1);
    }

    private _onKeyUp(event: EventKeyboard): void {
        this._setKey(event.keyCode, 0);
    }

    private _setKey(key: KeyCode, value: number): void {
        switch (key) {
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this._keys.y = value;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this._keys.y = -value;
                break;
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this._keys.x = -value;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._keys.x = value;
                break;
            default:
                return;
        }

        if (this._touchId === null) {
            this.direction.set(this._keys);
            if (this.direction.lengthSqr() > 1) {
                this.direction.normalize();
            }
        }
    }
}
