import { Engine, Color } from 'excalibur';
import { loader } from './resources';
import { TestScene1 } from './test_scene_1';
import { GameContext } from './game-context';

const engine = new Engine({
  width: 640,
  height: 360,
  backgroundColor: Color.fromHex('#282a36'), // dracula
  antialiasing: false,
  // Note: we intentionally do NOT set fixedUpdateFps here.
  // We drive fixed timestep ourselves inside GameContext.
});

// Single source of truth
const gameContext = new GameContext();

// Register scene
const testScene1 = new TestScene1();
engine.add('test_scene_1', testScene1);

// Start and pass GameContext into the scene
engine.start(loader).then(() => {
  engine.goToScene('test_scene_1', {
    sceneActivationData: gameContext,
  });
  console.log('Game started → test_scene_1 with manual fixed timestep (60 Hz)');
});

// Debug access from browser console
(window as any).engine = engine;
(window as any).gameContext = gameContext;
(window as any).test_scene_1 = testScene1;
