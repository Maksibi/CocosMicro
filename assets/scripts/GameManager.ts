import {
    _decorator,
    Camera,
    Canvas,
    Color,
    Component,
    director,
    Graphics,
    Input,
    KeyCode,
    Label,
    Layers,
    Node,
    UITransform,
    Widget,
    input,
    view,
} from 'cc';
import { CameraFollow } from './CameraFollow';
import { Coin } from './Coin';
import { FinishZone } from './FinishZone';
import { Joystick } from './Joystick';
import { tintMesh } from './PrimitiveUtil';
import { PlayerController } from './PlayerController';

const { ccclass } = _decorator;

/** Unity analog: a tiny GameMode / HUD controller */
@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager | null = null;

    public joystick: Joystick | null = null;
    public finished = false;
    public coins = 0;
    public coinTotal = 0;

    private _scoreLabel: Label | null = null;
    private _hintLabel: Label | null = null;
    private _resultRoot: Node | null = null;
    private _resultLabel: Label | null = null;

    onLoad(): void {
        GameManager.instance = this;
        this._buildWorld();
        this._buildUi();
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        if (GameManager.instance === this) {
            GameManager.instance = null;
        }
    }

    public addCoin(): void {
        if (this.finished) {
            return;
        }
        this.coins += 1;
        this._refreshHud();
    }

    public completeRun(): void {
        if (this.finished) {
            return;
        }
        this.finished = true;
        if (this._resultRoot) {
            this._resultRoot.active = true;
        }
        if (this._resultLabel) {
            this._resultLabel.string = `Финиш!\nМонеты: ${this.coins} / ${this.coinTotal}\n\nНажмите R, чтобы начать заново`;
        }
        if (this._hintLabel) {
            this._hintLabel.string = 'Забег закончен';
        }
    }

    private _onKeyDown(event: { keyCode: KeyCode }): void {
        if (this.finished && event.keyCode === KeyCode.KEY_R) {
            director.loadScene('scene');
        }
    }

    private _buildWorld(): void {
        const scene = this.node.scene;
        const placedCoins = scene.getComponentsInChildren(Coin);
        this.coinTotal = placedCoins.length;
        this.coins = 0;

        const player = scene.getChildByName('Player') ?? scene.getChildByName('Capsule');
        if (player) {
            player.name = 'Player';
            tintMesh(player, new Color(70, 140, 255, 255));
            const controller = player.getComponent(PlayerController) ?? player.addComponent(PlayerController);
            controller.coins = placedCoins;
            controller.finishZones = scene.getComponentsInChildren(FinishZone);
            controller.onCoinCollected = () => this.addCoin();
            controller.onFinished = () => this.completeRun();
        }

        const camera = scene.getChildByName('Main Camera');
        if (camera && player) {
            const follow = camera.getComponent(CameraFollow) ?? camera.addComponent(CameraFollow);
            follow.target = player;
        }
    }

    private _buildUi(): void {
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
        this._hintLabel.string = 'Расставьте Coin и Finish в сцене. Джойстик или WASD.';
        this._refreshHud();

        this._createJoystick(canvasNode, visible);
        this._createResult(canvasNode, visible);

        const player = scene.getChildByName('Player');
        const controller = player?.getComponent(PlayerController);
        if (controller) {
            controller.joystick = this.joystick;
        }
    }

    private _createJoystick(canvas: Node, visible: { width: number; height: number }): void {
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
        const dimUi = dim.addComponent(UITransform);
        dimUi.setContentSize(visible.width, visible.height);
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

    private _refreshHud(): void {
        if (this._scoreLabel) {
            this._scoreLabel.string = `Монеты: ${this.coins} / ${this.coinTotal}`;
        }
    }
}

export function restartScene(): void {
    director.loadScene('scene');
}
