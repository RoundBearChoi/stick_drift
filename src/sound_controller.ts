import { Resources } from './resources';

/**
 * Thin wrapper around the loaded sounds.
 * Keeps play calls in one place so volume / future pooling / mute can live here.
 */
class SoundController {
  playJump(): void {
    // higher / lighter tone — already baked into the wav
    void Resources.jump_sound.play(0.65);
  }

  playLand(): void {
    // lower / stiffer tone
    void Resources.land_sound.play(0.75);
  }
}

export const soundController = new SoundController();
