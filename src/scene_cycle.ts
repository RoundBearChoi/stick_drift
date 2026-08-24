import { Engine, Keys } from 'excalibur';
import { GameContext } from './game_context';
import { GameplayTestScene1 } from './gameplay_test_scene_1';
import { LevelEditorTestScene } from './level_editor_test_scene';
import { TestScene1 } from './test_scene_1';
import { TestScene2 } from './test_scene_2';

//--------------------
// temporary debug scene cycling (F2 = previous, F4 = next)
// creates a brand-new instance every switch and deletes the old one
//--------------------

const SCENE_CTORS = [
  GameplayTestScene1,
  LevelEditorTestScene,
  TestScene1,
  TestScene2,
] as const;

const SCENE_KEYS = [
  'gameplay_test_scene_1',
  'level_editor_test_scene',
  'test_scene_1',
  'test_scene_2',
] as const;

type SceneCtor = (typeof SCENE_CTORS)[number];

/** tracks which logical scene is currently active so F2/F4 stay in order */
let currentIndex = 0;

/**
 * setting up for the event system
 * only used once in the initial scene so it's reliable enough
 */
export function setupSceneCycle(engine: Engine, gameContext: GameContext): void {
  engine.input.keyboard.on('press', (evt) => {
    if (evt.key === Keys.F2) {
      void cycleScene(engine, gameContext, -1);
    } else if (evt.key === Keys.F4) {
      void cycleScene(engine, gameContext, +1);
    }
  });
}

async function cycleScene(
  engine: Engine,
  gameContext: GameContext,
  direction: -1 | 1
): Promise<void> {
  // try to sync currentIndex from the live scene name (in case something else switched scenes)
  const liveName = engine.currentSceneName;
  const liveIdx = (SCENE_KEYS as readonly string[]).indexOf(liveName);
  if (liveIdx !== -1) {
    currentIndex = liveIdx;
  }

  const nextIndex =
    (currentIndex + direction + SCENE_CTORS.length) % SCENE_CTORS.length;

  const Ctor: SceneCtor = SCENE_CTORS[nextIndex];
  const nextKey = SCENE_KEYS[nextIndex];

  // 1. brand-new instance (all private fields start undefined → existing if (!this._xxx) guards create everything fresh)
  const nextScene = new Ctor();

  // 2. remember the old scene before we switch
  const oldScene = engine.currentScene;

  // 3. register the new one (overwrites the key if it already existed)
  engine.add(nextKey, nextScene);

  // 4. switch
  await engine.goToScene(nextKey, {
    sceneActivationData: gameContext,
  });

  // 5. old scene is now deactivated → safe to delete so it can be GC'd
  if (oldScene && oldScene !== nextScene) {
    engine.removeScene(oldScene);
  }

  currentIndex = nextIndex;

  // keep the window debug globals pointing at the live instance
  (window as any)[nextKey] = nextScene;

  //console.log(`[scene_cycle] ${direction === 1 ? 'next' : 'prev'} → ${nextKey} (fresh instance)`);
}
