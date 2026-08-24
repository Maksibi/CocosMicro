import {
    _decorator,
    Camera,
    Canvas,
    Color,
    Component,
    Graphics,
    Label,
    Layers,
    Node,
    UITransform,
    Widget,
    view,
} from 'cc';
import { Joystick } from './Joystick';
import { RunSession } from './RunSession';

const { ccclass } = _decorator;

/** Builds and updates HUD. Knows nothing about level geometry. */
@ccclass('HudView')
export class HudView extends Component {
    public joystick: Joystick | null = null;

    private _scoreLabel: Label | null = null;
    private _hintLabel: Label | null = null;
    private _resultRoot: Node | null = null;
    private _resultLabel: Label | null = null;
    private _session: RunSession | null = null;

    public build(): void {
        const scene = this.node.scene;
        const canvasNode = new Node('Canvas');
        canvasNode.layer = Layers.Enum.UI_2D;
        scene.addChild(canvasNode);

        const canvasTransform = canvasNode.addComponent(UITransform);
        const visible = view.getVisibleSize();
        canvasTransform.setContentSize(visible.width, visible.height);

        const canvas = canvasNode.addComponent(Canvas);
        canvas.alignCanvasWithScreen = true;

        const uiCameraNode = new Node('UI Camera');
        scene.addChild(uiCameraNode);
        const uiCamera = uiCameraNode.addComponent(Camera);
        uiCamera.projection = Camera.ProjectionType.ORTHO;
        uiCamera.priority = 10;
        uiCamera.near = 1;
        uiCamera.far = 1000;
        uiCamera.orthoHeight = visible.height / 2;
        uiCamera.visibility = Layers.Enum.UI_2D;
        uiCamera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
        canvas.cameraComponent = uiCamera;

        this._scoreLabel = this._makeLabel(canvasNode, 'ScoreLabel', 36, new Color(255, 255, 255, 255), 0, visible.height * 0.42);
        this._hintLabel = this._makeLabel(canvasNode, 'HintLabel', 22, new Color(220, 220, 220, 220), 0, visible.height * 0.36);
        this._hintLabel.string = 'Джойстик или WASD. Соберите монеты на извилистой трассе.';

        this._createJoystick(canvasNode);
        this._createResult(canvasNode, visible);
        this.refresh();
    }

    public bind(session: RunSession): void {
        this._session = session;
        session.onChanged = () => this.refresh();
        this.refresh();
    }

    public refresh(): void {
        const session = this._session;
        if (!session) {
            return;
        }

        if (this._scoreLabel) {
            this._scoreLabel.string = `Монеты: ${session.coins} / ${session.coinTotal}`;
        }

        if (!session.finished) {
            if (this._resultRoot) {
                this._resultRoot.active = false;
            }
            return;
        }

        if (this._resultRoot) {
            this._resultRoot.active = true;
        }
        if (this._resultLabel) {
            this._resultLabel.string =
                `Финиш!\nМонеты: ${session.coins} / ${session.coinTotal}\n\nНажмите R, чтобы начать заново`;
        }
        if (this._hintLabel) {
            this._hintLabel.string = 'Забег закончен';
        }
    }

    private _createJoystick(canvas: Node): void {
        const root = new Node('Joystick');
        root.layer = Layers.Enum.UI_2D;
        canvas.addChild(root);
        const ui = root.addComponent(UITransform);
        ui.setContentSize(240, 240);
        ui.setAnchorPoint(0.5, 0.5);

        const widget = root.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignBottom = true;
        widget.left = 36;
        widget.bottom = 36;
        widget.alignMode = Widget.AlignMode.ALWAYS;

        const bg = this._circle(root, 'Background', 100, new Color(255, 255, 255, 55));
        const knob = this._circle(root, 'Knob', 38, new Color(255, 255, 255, 200));
        bg.setPosition(0, 0, 0);
        knob.setPosition(0, 0, 0);

        const joystick = root.addComponent(Joystick);
        joystick.knob = knob;
        this.joystick = joystick;
    }

    private _createResult(canvas: Node, visible: { width: number; height: number }): void {
        const root = new Node('Result');
        root.layer = Layers.Enum.UI_2D;
        canvas.addChild(root);
        root.addComponent(UITransform).setContentSize(visible.width, visible.height);
        root.active = false;
        this._resultRoot = root;

        const dim = new Node('Dim');
        dim.layer = Layers.Enum.UI_2D;
        root.addChild(dim);
        dim.addComponent(UITransform).setContentSize(visible.width, visible.height);
        const g = dim.addComponent(Graphics);
        g.fillColor = new Color(0, 0, 0, 160);
        g.rect(-visible.width / 2, -visible.height / 2, visible.width, visible.height);
        g.fill();

        this._resultLabel = this._makeLabel(root, 'ResultLabel', 42, new Color(255, 230, 120, 255), 0, 40);
    }

    private _circle(parent: Node, name: string, radius: number, color: Color): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(radius * 2, radius * 2);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;
        graphics.circle(0, 0, radius);
        graphics.fill();
        return node;
    }

    private _makeLabel(parent: Node, name: string, fontSize: number, color: Color, x: number, y: number): Label {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(900, 120);
        node.setPosition(x, y, 0);
        const label = node.addComponent(Label);
        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.enableWrapText = true;
        label.string = '';
        return label;
    }
}
