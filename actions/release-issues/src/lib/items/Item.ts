import { createHash } from 'crypto';
import type { VersionTrack } from '@onezerocompany/commit';
import { debug } from '@actions/core';
import type { Globals } from '../../globals';
import { icons } from './icons';
import { ItemStatus } from './ItemStatus';
import { ItemType } from './ItemType';
import { labels } from './labels';
import {
  updateChangelogApproval,
  updateReleaseClearance,
  updateReleaseCreation,
} from './update';

export interface ItemJSON {
  id: string;
  type: ItemType;
  status: ItemStatus;
}

export interface ItemMetadata {
  track?: VersionTrack;
  dependsOn: ItemType[];
}

export class Item {
  public readonly type: ItemType;
  public metadata: ItemMetadata;
  public status = ItemStatus.unknown;

  public constructor(inputs: { type: ItemType; metadata: ItemMetadata }) {
    this.type = inputs.type;
    this.metadata = inputs.metadata;
  }

  public get id(): string {
    // hash the type and metadata
    const hashContent = `${this.type}-${JSON.stringify(this.metadata)}`;
    return createHash('md5').update(hashContent).digest('hex');
  }

  public get json(): ItemJSON {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
    };
  }

  public get labels(): { [key in ItemStatus]: string } {
    return labels[this.type];
  }

  public get statusLine(): string {
    return `- [ ] :${icons[this.status].code}: ${
      this.labels[this.status]
    } <!--ID ${this.id} ID-->`;
  }

  public async update(globals: Globals): Promise<ItemStatus> {
    debug(`updating item: ${this.id}`);
    switch (this.type) {
      case ItemType.changelogApproved:
        this.status = await updateChangelogApproval(globals, this);
        break;
      case ItemType.releaseClearance:
        this.status = await updateReleaseClearance(globals, this);
        break;
      case ItemType.releaseCreation:
        this.status = ItemStatus.unknown;
        this.status = await updateReleaseCreation(globals, this);
        break;
      default:
        throw new Error(`Unknown item type: ${this.type}`);
    }
    return this.status;
  }
}
