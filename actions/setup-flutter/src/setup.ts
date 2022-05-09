import { platform, homedir } from 'os';
import { createWriteStream, rmSync } from 'fs';
import { get } from 'https';
import { execSync } from 'child_process';
import { addPath } from '@actions/core';

function currentPlatform() {
  switch (platform()) {
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
}

function urlForVersion(input: {
  platform: string;
  version: string;
  channel: string;
}): {
  url: string;
  file: string;
} {
  const base = 'https://storage.googleapis.com/flutter_infra_release/releases';
  const ext = input.platform === 'linux' ? 'tar.xz' : 'zip';
  const folder = `${input.channel}/${input.platform}`;
  return {
    url: `${base}/${folder}/flutter_${input.platform}_${input.version}-${input.channel}.${ext}`,
    file: `${homedir()}/flutter_${input.platform}_${input.version}-${
      input.channel
    }.${ext}`,
  };
}

async function downloadFile(input: { url: string; file: string }) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(input.file);
    stream.on('finish', resolve);
    stream.on('error', reject);
    get(input.url, (response) => {
      response.pipe(stream);
    }).on('error', reject);
  });
}

export async function setup(input: { version: string; channel: string }) {
  // download the sdk
  const download = urlForVersion({ ...input, platform: currentPlatform() });
  await downloadFile(download);

  // decompress the file
  if (download.file.endsWith('.zip')) {
    execSync(`unzip ${download.file} -d ${homedir()}`);
  } else if (download.file.endsWith('.tar.xz')) {
    execSync(`tar -xf ${download.file} -C ${homedir()}`);
  } else {
    throw new Error(`Unsupported file extension: ${download.file}`);
  }

  // remove the downloaded file
  rmSync(download.file);

  // install flutter into profiles
  addPath(`${homedir()}/flutter/bin`);
}
