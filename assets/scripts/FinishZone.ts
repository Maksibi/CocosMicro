import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

/** Put this on a node you place in the scene. Reaching it ends the run. */
@ccclass('FinishZone')
export class FinishZone extends Component {
    @property
    public radius = 2.5;
}
