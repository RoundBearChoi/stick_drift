import { Engine, Color } from 'excalibur';
import { loader } from './resources';
import { TestScene1 } from './test_scene_1';
import { TestScene2 } from './test_scene_2';
import { GameContext } from './game-context';
import { setupSceneCycle } from './scene_cycle';

const engine = new Engine({
  width: 640,
  height: 360,
  backgroundColor: Color.fromHex('#282a36'), // going for dracula color theme
  antialiasing: false,
  // we intentionally do NOT set fixedUpdateFps here.
  // we drive fixed timestep ourselves inside GameContext.
});

const gameContext = new GameContext();

// register scenes
const testScene1 = new TestScene1();
engine.add('test_scene_1', testScene1);

const testScene2 = new TestScene2();
engine.add('test_scene_2', testScene2);

// start and pass GameContext into scene
engine.start(loader).then(() => {
  engine.goToScene('test_scene_1', {
    sceneActivationData: gameContext,
  });

  // temporary debug scene cycling (F2 / F3)
  setupSceneCycle(engine, gameContext);

  console.log('------ game started ------');
  console.log('manual fixed timestep (60 Hz)');
});

// debug access from browser console
(window as any).engine = engine;
(window as any).gameContext = gameContext;
(window as any).test_scene_1 = testScene1;
(window as any).test_scene_2 = testScene2;
