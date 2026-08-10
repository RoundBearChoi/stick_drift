import { Engine, Keys } from 'excalibur';
import { GameContext } from './game_context';

//--------------------
// temporary debug scene cycling (F2 = previous, F4 = next)
//--------------------

const SCENE_ORDER = [
  // initial_scene isn't included because we only use it once for that first user gesture
  'test_scene_1',
  'test_scene_2',
] as const;

type SceneKey = (typeof SCENE_ORDER)[number];

/**
 * setting up for the event system
 * only used once in the intial scene so it's reliable enough
 */
export function setupSceneCycle(engine: Engine, gameContext: GameContext): void {
  // hard coded for now
  engine.input.keyboard.on('press', (evt) => {
    if (evt.key === Keys.F2) {
      cycleScene(engine, gameContext, -1);
    } else if (evt.key === Keys.F4) {
      cycleScene(engine, gameContext, +1);
    }
  });
}

function cycleScene(engine: Engine, gameContext: GameContext, direction: -1 | 1): void {
  const current = engine.currentSceneName as SceneKey;
  const idx = SCENE_ORDER.indexOf(current);

  if (idx === -1) {
    console.warn('[scene_cycle] current scene not in SCENE_ORDER:', current);
    return;
  }

  const nextIdx = (idx + direction + SCENE_ORDER.length) % SCENE_ORDER.length;
  const nextKey = SCENE_ORDER[nextIdx];

  console.log(`[scene_cycle] ${direction === 1 ? 'next' : 'prev'}: ${current} \u2192 ${nextKey}`);

  engine.goToScene(nextKey, {
    sceneActivationData: gameContext,
  });
}
