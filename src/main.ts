import { Engine, ImageFiltering, DisplayMode } from 'excalibur';
import { loader } from './resources';
import { GestureScene } from './gesture_scene';
import { GameplayTestScene1 } from './gameplay_test_scene_1';
import { LevelEditorTestScene } from './level_editor_test_scene';
import { TestScene1 } from './test_scene_1';
import { TestScene2 } from './test_scene_2';
import { GameContext, NATIVE_RESOLUTION } from './game_context';
import { setupSceneCycle } from './scene_cycle';
import { ResolutionScale } from './resolution_scale';
import { DraculaColorScheme } from './dracula_color_scheme';

const engine = new Engine({
  width: NATIVE_RESOLUTION.width,
  height: NATIVE_RESOLUTION.height,
  backgroundColor: DraculaColorScheme.background,
  displayMode: DisplayMode.Fixed, // important for clean integer CSS scaling
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
const resolution_scale = new ResolutionScale();

// create input interpreter once the Engine exists
game_context.createInputInterpreter(engine);

// register scenes
const gesture_scene = new GestureScene();
engine.add('gesture_scene', gesture_scene);

const gameplay_test_scene_1 = new GameplayTestScene1();
engine.add('gameplay_test_scene_1', gameplay_test_scene_1);

const level_editor_test_scene = new LevelEditorTestScene();
engine.add('level_editor_test_scene', level_editor_test_scene);

const test_scene_1 = new TestScene1();
engine.add('test_scene_1', test_scene_1);

const test_scene_2 = new TestScene2();
engine.add('test_scene_2', test_scene_2);

// start and pass game context into scene
engine.start(loader).then(() => {
  // attach integer scaling after engine is ready
  resolution_scale.attachToEngine(engine);

  // wire resolution debug so the on-screen label stays in sync
  game_context.resolution_debug.setScale(resolution_scale);
  resolution_scale.setDebugRefresh(() => game_context.resolution_debug.refresh());

  engine.goToScene('gesture_scene', {
    sceneActivationData: game_context,
  });

  // temporary debug scene cycling (F2 / F4)
  setupSceneCycle(engine, game_context);

  console.log('🚀 game started');
  console.log('integer resolution scaling ready (f8 to cycle)');
});

// debug access from browser console
(window as any).engine = engine;
(window as any).game_context = game_context;
(window as any).resolution_scale = resolution_scale;
(window as any).gesture_scene = gesture_scene;
(window as any).gameplay_test_scene_1 = gameplay_test_scene_1;
(window as any).level_editor_test_scene = level_editor_test_scene;
(window as any).test_scene_1 = test_scene_1;
(window as any).test_scene_2 = test_scene_2;
