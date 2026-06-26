export const REMOTION_COMPOSITION = "Retrospectiva";
export const RENDER_OUTPUT_NAME = "out.mp4";

/** Paths candidatos: canônico Remotion, composition e legado (presenteId). */
export function buildRenderOutputKeys(renderId: string, presenteId: string): string[] {
  return [
    `renders/${renderId}/${RENDER_OUTPUT_NAME}`,
    `renders/${renderId}/renders/${REMOTION_COMPOSITION}/${RENDER_OUTPUT_NAME}`,
    `renders/${renderId}/renders/${presenteId}/${RENDER_OUTPUT_NAME}`,
  ];
}

export function buildLegacyOutputKey(presenteId: string): string {
  return `renders/${presenteId}/${RENDER_OUTPUT_NAME}`;
}

export async function findExistingRenderKey(
  keys: string[],
  exists: (key: string) => Promise<boolean>,
): Promise<string | null> {
  for (const key of keys) {
    if (await exists(key)) return key;
  }
  return null;
}
