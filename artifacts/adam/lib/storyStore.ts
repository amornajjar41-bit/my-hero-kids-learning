/**
 * Tiny module-level store for the currently selected story ID.
 * Used to pass the story selection from the list screen to the reader
 * without relying on Expo Router URL params (which can be unreliable
 * on some Expo web builds).
 */
let _currentStoryId: string = "";

export function setCurrentStoryId(id: string): void {
  _currentStoryId = id;
}

export function getCurrentStoryId(): string {
  return _currentStoryId;
}
