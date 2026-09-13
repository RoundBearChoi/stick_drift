import { Engine, Vector, vec } from 'excalibur';

/**
 * page position → internal screen → world.
 * accounts for the CSS integer canvas scale used by ResolutionScale.
 */
export function getEditorWorldPos(engine: Engine): Vector | null {
  const pagePos = engine.input.pointers.primary.lastPagePos;
  if (!pagePos) return null;

  const canvas = engine.canvas;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const screenPos = vec(
    (pagePos.x - rect.left) * scaleX,
    (pagePos.y - rect.top) * scaleY
  );

  return engine.screen.screenToWorldCoordinates(screenPos);
}
