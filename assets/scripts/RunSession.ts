import { _decorator, Component, Input, KeyCode, director, input } from 'cc';

const { ccclass } = _decorator;

/** Owns run state only: score, finished flag, restart. No UI / no spawning. */
@ccclass('RunSession')
export class RunSession extends Component {
    public coins = 0;
    public coinTotal = 0;
    public finished = false;

    /** Fired after any state change the HUD cares about. */
    public onChanged: (() => void) | null = null;

    onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
    }

    public begin(coinTotal: number): void {
        this.coins = 0;
        this.coinTotal = coinTotal;
        this.finished = false;
        this.onChanged?.();
    }

    public addCoin(): void {
        if (this.finished) {
            return;
        }
        this.coins += 1;
        this.onChanged?.();
    }

    public completeRun(): void {
        if (this.finished) {
            return;
        }
        this.finished = true;
        this.onChanged?.();
    }

    private _onKeyDown(event: { keyCode: KeyCode }): void {
        if (this.finished && event.keyCode === KeyCode.KEY_R) {
            director.loadScene('scene');
        }
    }
}
