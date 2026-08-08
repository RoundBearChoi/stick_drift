import { Engine, Color, vec } from 'excalibur';
import { loader } from './resources';
import { TestScene1 } from './test_scene_1';

const engine = new Engine({
    width: 640,
    height: 360,
    backgroundColor: Color.fromHex('#282a36'),   // going for dracula color scheme
    fixedUpdateFps: 60,
    antialiasing: false,
});

// register scene
const testScene1 = new TestScene1();
engine.add('test_scene_1', testScene1);
engine.goToScene('test_scene_1');

/*
// pause when tab is hidden
engine.on('hidden', () => {
    engine.stop();
});
engine.on('visible', () => {
    engine.start();
});
*/

// start game
engine.start(loader).then(() => {
    console.log('Game started → test_scene_1 (640×360)');
});

// debug access
(window as any).engine = engine;
(window as any).test_scene_1 = testScene1;
