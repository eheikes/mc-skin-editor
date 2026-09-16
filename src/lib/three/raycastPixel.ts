import * as THREE from 'three';

/** Converts a raycast hit's interpolated UV (with flipY=false texture convention) into an integer atlas pixel coordinate. */
export function uvToPixel(uv: THREE.Vector2, atlasWidth: number, atlasHeight: number): { x: number; y: number } {
	const x = Math.min(atlasWidth - 1, Math.max(0, Math.floor(uv.x * atlasWidth)));
	const y = Math.min(atlasHeight - 1, Math.max(0, Math.floor(uv.y * atlasHeight)));
	return { x, y };
}

export function pickPixel(
	raycaster: THREE.Raycaster,
	meshes: THREE.Mesh[],
	atlasWidth: number,
	atlasHeight: number
): { x: number; y: number } | null {
	const hits = raycaster.intersectObjects(meshes, false);
	for (const hit of hits) {
		if (!hit.uv) continue;
		return uvToPixel(hit.uv, atlasWidth, atlasHeight);
	}
	return null;
}
