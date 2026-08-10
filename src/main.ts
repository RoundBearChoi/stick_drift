import { Engine, Color, ImageFiltering } from 'excalibur';
import { loader } from './resources';
import { InitialScene } from './gesture_scene';
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

const game_context = new GameContext();

// register scenes
const gesture_scene = new InitialScene();
engine.add('gesture_scene', gesture_scene);

const test_scene_1 = new TestScene1();
engine.add('test_scene_1', test_scene_1);

const test_scene_2 = new TestScene2();
engine.add('test_scene_2', test_scene_2);

// start and pass game context into scene
engine.start(loader).then(() => {
  engine.goToScene('gesture_scene', {
    sceneActivationData: game_context,
  });

  // temporary debug scene cycling (F2 / F4)
  setupSceneCycle(engine, game_context);

  console.log('------ game started ------');
  console.log('manual fixed timestep (60 Hz)');
});

// debug access from browser console
(window as any).engine = engine;
(window as any).game_context = game_context;
(window as any).gesture_scene = gesture_scene;
(window as any).test_scene_1 = test_scene_1;
(window as any).test_scene_2 = test_scene_2;
