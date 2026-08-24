import { _decorator, Color, Component, Node, Prefab } from 'cc';
import { CameraFollow } from './CameraFollow';
import { HudView } from './HudView';
import { buildLevel, LevelPrefabs } from './LevelBuilder';
import { tintMesh } from './PrimitiveUtil';
import { PlayerController } from './PlayerController';
import { RunSession } from './RunSession';

const { ccclass, property } = _decorator;

/**
 * Composition root: wires level, player, session and HUD.
 * Prefab refs are assigned in the Inspector.
 */
@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    @property(Prefab)
    public groundPrefab: Prefab | null = null;

    @property(Prefab)
    public wallPrefab: Prefab | null = null;

    @property(Prefab)
    public obstaclePrefab: Prefab | null = null;

    @property(Prefab)
    public coinPrefab: Prefab | null = null;

    @property(Prefab)
    public finishPrefab: Prefab | null = null;

    onLoad(): void {
        const prefabs = this._requirePrefabs();
        const scene = this.node.scene;

        const levelRoot = new Node('Level');
        scene.addChild(levelRoot);
        const level = buildLevel(levelRoot, prefabs);

        const session = this.node.getComponent(RunSession) ?? this.node.addComponent(RunSession);
        session.begin(level.coinTotal);

        const hud = this.node.getComponent(HudView) ?? this.node.addComponent(HudView);
        hud.build();
        hud.bind(session);

        const player = scene.getChildByName('Player') ?? scene.getChildByName('Capsule');
        if (player) {
            player.name = 'Player';
            player.setPosition(level.startPos);
            tintMesh(player, new Color(70, 140, 255, 255));

            const controller = player.getComponent(PlayerController) ?? player.addComponent(PlayerController);
            controller.coins = level.coins;
            controller.finishZones = level.finishZones;
            controller.joystick = hud.joystick;
            controller.onCoinCollected = () => session.addCoin();
            controller.onFinished = () => session.completeRun();
        }

        const camera = scene.getChildByName('Main Camera');
        if (camera && player) {
            const follow = camera.getComponent(CameraFollow) ?? camera.addComponent(CameraFollow);
            follow.target = player;
            camera.setWorldPosition(level.startPos.x, level.startPos.y + 9, level.startPos.z - 12);
        }
    }

    private _requirePrefabs(): LevelPrefabs {
        const missing: string[] = [];
        if (!this.groundPrefab) missing.push('groundPrefab');
        if (!this.wallPrefab) missing.push('wallPrefab');
        if (!this.obstaclePrefab) missing.push('obstaclePrefab');
        if (!this.coinPrefab) missing.push('coinPrefab');
        if (!this.finishPrefab) missing.push('finishPrefab');
        if (missing.length > 0) {
            throw new Error(`GameBootstrap: assign prefabs in Inspector: ${missing.join(', ')}`);
        }

        return {
            ground: this.groundPrefab!,
            wall: this.wallPrefab!,
            obstacle: this.obstaclePrefab!,
            coin: this.coinPrefab!,
            finish: this.finishPrefab!,
        };
    }
}
