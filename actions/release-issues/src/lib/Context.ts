import * as core from '@actions/core';
import * as github from '@actions/github';
import { CommitMessage, parseMessage, Version } from '@onezerocompany/commit';
import type { PushEvent } from '@octokit/webhooks-definitions/schema';
import { Settings } from './settings/Settings';
import { Issue } from './status/Issue';
import { parse } from 'yaml';
import { resolve } from 'path';
import { readFileSync } from 'fs';

export enum Action {
  create = 'create',
  update = 'update',
  stop = 'stop',
}

export interface Commit {
  sha: string;
  message: CommitMessage;
}

export class Context {
  // general context
  public readonly token = core.getInput('token');
  public readonly repo = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  };

  // settings set in the repo
  public readonly settings: Settings;

  // specific to this run of the action

  public readonly action: Action;
  public readonly commits?: Commit[] = [];
  public readonly issue = new Issue(this);

  private loadSettings(): Settings {
    const file =
      core.getInput('settings', {
        trimWhitespace: true,
        required: false,
      }) ?? '.release-settings.yml';
    const filePath = resolve(process.cwd(), file);
    core.debug(`Loading settings from ${filePath}`);

    const content = readFileSync(filePath, 'utf8');
    const settings = parse(content);

    return new Settings(settings);
  }

  constructor() {
    this.settings = this.loadSettings();
    switch (github.context.eventName) {
      // push to main branch
      case 'push':
        const pushEvent: PushEvent = github.context.payload as PushEvent;

        // make sure the push is to the main branch
        if (pushEvent.ref !== 'refs/heads/main') {
          core.setFailed('Only pushes to the main branch are supported');
          this.action = Action.stop;
          break;
        }

        this.action = Action.create;

        // convert the commits to a list of Commit objects
        this.commits = pushEvent.commits.map((commit) => ({
          sha: commit.id,
          message: parseMessage(commit.message),
        }));

        this.issue = new Issue(this, {
          comments: [],
          version: new Version(),
        });

        break;

      default:
        core.setFailed('Unsupported event');
        this.action = Action.stop;
    }
  }
}
