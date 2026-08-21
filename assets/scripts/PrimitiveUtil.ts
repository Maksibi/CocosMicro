import { Color, Material, MeshRenderer, Node, Vec3, primitives, utils } from 'cc';

/** Unity analog: GameObject.CreatePrimitive + sharedMaterial.color */
export function createPrimitive(
    parent: Node,
    name: string,
    geometry: primitives.IGeometry,
    color: Color,
    position: Vec3,
    scale?: Vec3,
): Node {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(position);
    if (scale) {
        node.setScale(scale);
    }

    const renderer = node.addComponent(MeshRenderer);
    renderer.mesh = utils.MeshUtils.createMesh(geometry);

    const material = new Material();
    material.initialize({ effectName: 'builtin-unlit' });
    material.setProperty('mainColor', color);
    renderer.material = material;

    return node;
}

export function tintMesh(node: Node, color: Color): void {
    const renderer = node.getComponent(MeshRenderer);
    if (!renderer) {
        return;
    }
    const material = new Material();
    material.initialize({ effectName: 'builtin-unlit' });
    material.setProperty('mainColor', color);
    renderer.material = material;
}
