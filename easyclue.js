//easyclue.js

const SCROLL_BOX_ID = 24362;
const CLUE_COMPASS_ID = 30363;
const SPADE_ID = 952;
const CLUE_SCROLL_NAME = 'Clue scroll (easy)';

let state = 0;
let timeout = 0;

function onGameTick() {
	if (timeout > 0) {
		return timeout--;
	}

	switch (state) {
		case 0:
			return openScrollBox();
		case 1:
			return readClueScroll();
		case 2:
			return handleCurrentStep();
		default:
			state = 0;
			return;
	}
}

function openScrollBox() {
	if (bot.inventory.containsName(CLUE_SCROLL_NAME)) {
		state = 1;
		return;
	}

	if (!bot.inventory.containsId(SCROLL_BOX_ID)) {
		bot.printGameMessage('No scroll box found in inventory!');
		return;
	}

	bot.inventory.interactWithIds([SCROLL_BOX_ID], ['Open']);
	timeout = 2;
	return;
}

function readClueScroll() {
	if (!bot.inventory.containsName(CLUE_SCROLL_NAME)) {
		state = 0;
		return;
	}

	// Check if it's an equipment clue (assuming this is implemented)
	if (isEquipmentClue()) {
		bot.inventory.interactWithNames([CLUE_SCROLL_NAME], ['Drop']);
		state = 0;
		timeout = 2;
		return;
	}

	bot.inventory.interactWithNames([CLUE_SCROLL_NAME], ['Read']);
	timeout = 2;
	state = 2;
	return;
}

function handleCurrentStep() {
	if (!bot.inventory.containsName(CLUE_SCROLL_NAME)) {
		state = 0;
		return;
	}

	if (!bot.inventory.containsId(CLUE_COMPASS_ID)) {
		state = 0;
		return;
	}

	const localPlayer = client.getLocalPlayer();
	if (localPlayer === null) {
		return;
	}

	// Check NPC first
	const npc = client.getHintArrowNpc();
	if (npc !== null) {
		bot.npcs.interactSupplied(npc, 'Talk-to');
		timeout = 3;
		return;
	}

	// Get hint arrow location
	const hintPoint = client.getHintArrowPoint();
	if (hintPoint === null) {
		// If no hint point, try getting location from compass
		bot.inventory.interactWithIds([CLUE_COMPASS_ID], ['Current-step']);
		timeout = 1;
		return;
	}

	const playerLocation = localPlayer.getWorldLocation();
	const distance = playerLocation.distanceTo(hintPoint);

	// First check if we can find searchable objects when we're close enough
	if (distance <= 3) {
		const objects = bot.objects.getTileObjectsWithOptions([
			'Search',
			'Open',
			'Check',
		]);
		if (objects.length > 0) {
			const nearestObject = bot.objects.getClosest(objects);
			if (nearestObject !== null) {
				const action = getObjectAction(nearestObject.getId(), [
					'Search',
					'Open',
					'Check',
				]);
				if (action !== null) {
					bot.objects.interactSuppliedObject(nearestObject, action);
					timeout = 3;
					return;
				}
			}
		}
	}

	// If we're not on the exact spot and there's nothing to search nearby,
	// assume it's a dig clue and try to walk to exact spot
	if (distance > 0) {
		bot.walking.walkToTrueWorldPoint(hintPoint.getX(), hintPoint.getY());
		timeout = 2;
		return;
	}

	// If we're exactly on the spot (meaning it's a dig clue), dig
	if (distance === 0 && bot.inventory.containsId(SPADE_ID)) {
		bot.inventory.interactWithIds([SPADE_ID], ['Dig']);
		timeout = 3;
		return;
	}
}

function getObjectAction(objectId, possibleActions) {
	const objectComposition = bot.objects.getTileObjectComposition(objectId);
	if (!objectComposition) return null;

	const actions = objectComposition.getActions();
	for (let i = 0; i < possibleActions.length; i++) {
		for (let j = 0; j < actions.length; j++) {
			if (actions[j] && actions[j] === possibleActions[i]) {
				return possibleActions[i];
			}
		}
	}
	return null;
}

function isEquipmentClue() {
	// Placeholder - implement equipment clue detection
	return false;
}

function onStart() {
	bot.printGameMessage('Easy Clue Solver started');
	state = 0;
	timeout = 0;
}

function onEnd() {
	bot.printGameMessage('Easy Clue Solver stopped');
}
