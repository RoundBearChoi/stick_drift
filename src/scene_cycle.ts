import { Engine, Keys } from 'excalibur';
import { GameContext } from './game_context';
import { GameplayTestScene1 } from './gameplay_test_scene_1';
import { GameplayTestScene2 } from './gameplay_test_scene_2';
import { LevelEditorTestScene } from './level_editor_test_scene';
import { TestScene1 } from './test_scene_1';
import { TestScene2 } from './test_scene_2';

//--------------------
// temporary scene cycling (F2 = previous, F4 = next)
// creates a brand-new instance every switch and deletes the old one
//--------------------

const SCENE_CTORS = [
  GameplayTestScene1,
  LevelEditorTestScene,
  GameplayTestScene2,
  TestScene1,
  TestScene2,
] as const;

const SCENE_KEYS = [
  'gameplay_test_scene_1',
  'level_editor_test_scene',
  'gameplay_test_scene_2',
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

  // brand-new instance (all private fields start undefined → existing if (!this._xxx) guards create everything fresh)
  const nextScene = new Ctor();

  // remember the old scene before we switch
  const oldScene = engine.currentScene;
  const oldKey = engine.currentSceneName;

  // register new scene (overwrites the key if it already existed)
  engine.add(nextKey, nextScene);

  // switch
  await engine.goToScene(nextKey, {
    sceneActivationData: gameContext,
  });

  // old scene is now deactivated → safe to delete so it can be GC'd
  if (oldScene && oldScene !== nextScene) {
    engine.removeScene(oldScene);
  }

  // drop window debug handle for the scene we left so the old instance is not pinned
  if (oldKey && oldKey !== nextKey) {
    delete (window as any)[oldKey];
  }

  currentIndex = nextIndex;

  // keep the window debug global pointing at the live instance only
  (window as any)[nextKey] = nextScene;
}
