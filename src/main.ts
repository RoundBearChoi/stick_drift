import { Engine, Color, ImageFiltering } from 'excalibur';
import { loader } from './resources';
import { InitialScene } from './initial_scene';
import { TestScene1 } from './test_scene_1';
import { TestScene2 } from './test_scene_2';
import { GameContext } from './game_context';
import { setupSceneCycle } from './scene_cycle';

const engine = new Engine({
  width: 640,
  height: 360,
  backgroundColor: Color.fromHex('#282a36'),
  antialiasing: {
    pixelArtSampler: false,
    filtering: ImageFiltering.Pixel,
    nativeContextAntialiasing: false,
    multiSampleAntialiasing: false,
    canvasImageRendering: 'pixelated'
  },
  snapToPixel: true, // almost mandatory with the above settings
  pixelRatio: 1, // keep at 1 unless you want internal upscaling
  suppressPlayButton: true, // skip excalibur's default start screen
});

const gameContext = new GameContext();

// register scenes
const initialScene = new InitialScene();
engine.add('initial_scene', initialScene);

const testScene1 = new TestScene1();
engine.add('test_scene_1', testScene1);

const testScene2 = new TestScene2();
engine.add('test_scene_2', testScene2);

// start and pass GameContext into scene
engine.start(loader).then(() => {
  engine.goToScene('initial_scene', {
    sceneActivationData: gameContext,
  });

  // temporary debug scene cycling (F2 / F4)
  setupSceneCycle(engine, gameContext);

  console.log('------ game started ------');
  console.log('manual fixed timestep (60 Hz)');
});

// debug access from browser console
(window as any).engine = engine;
(window as any).gameContext = gameContext;
(window as any).initial_scene = initialScene;
(window as any).test_scene_1 = testScene1;
(window as any).test_scene_2 = testScene2;
