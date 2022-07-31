import type { Globals } from '../../../globals';
import type { TrackSettings } from '../../settings/TrackSettings';
import type { Item } from '../Item';
import { itemChecked } from '../itemChecked';
import { ItemStatus } from '../ItemStatus';
import { createRelease } from './createRelease';

function state(
  trackSettings: TrackSettings,
  item: Item,
  globals: Globals,
): ItemStatus {
  if (trackSettings.release.manual) {
    // either the release is already released or the line has a checkmark in it
    if (item.status === ItemStatus.succeeded || itemChecked(globals, item)) {
      return ItemStatus.succeeded;
    }
    return ItemStatus.pending;
  }
  return ItemStatus.succeeded;
}

export async function updateRelease(
  globals: Globals,
  item: Item,
): Promise<ItemStatus> {
  const { track } = item.metadata;
  if (!track) return ItemStatus.unknown;
  const trackSettings = globals.settings[track];
  const newState = state(trackSettings, item, globals);
  if (newState === ItemStatus.succeeded && newState !== item.status) {
    await createRelease(globals, item);
  }
  return newState;
}
