<script lang="ts">
	import { layerVisibility, partVisibility } from '../lib/stores/visibility';
	import type { PartName } from '../lib/skin/types';

	const partLabels: { id: PartName; label: string }[] = [
		{ id: 'head', label: 'Head' },
		{ id: 'torso', label: 'Torso' },
		{ id: 'leftArm', label: 'Left Arm' },
		{ id: 'rightArm', label: 'Right Arm' },
		{ id: 'leftLeg', label: 'Left Leg' },
		{ id: 'rightLeg', label: 'Right Leg' }
	];

	function togglePart(id: PartName) {
		partVisibility.update((v) => ({ ...v, [id]: !v[id] }));
	}
</script>

<div class="visibility-panel">
	<div class="section">
		<div class="section-label">Layers</div>
		<label class="toggle">
			<input type="checkbox" bind:checked={$layerVisibility.base} />
			Body
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={$layerVisibility.overlay} />
			Outer Layer
		</label>
	</div>

	<div class="section">
		<div class="section-label">Body Parts</div>
		<div class="parts-grid">
			{#each partLabels as p}
				<label class="toggle">
					<input type="checkbox" checked={$partVisibility[p.id]} on:change={() => togglePart(p.id)} />
					{p.label}
				</label>
			{/each}
		</div>
	</div>
</div>

<style>
	.visibility-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.section-label {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.7;
		margin-bottom: 2px;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		cursor: pointer;
	}
	.parts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px 8px;
	}
</style>
