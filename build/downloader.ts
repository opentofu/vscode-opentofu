// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';

import axios from 'axios';

async function fileFromUrl(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

export interface Release {
  repository: string;
  package: string;
  destination: string;
  fileName: string;
  version: string;
  extract: boolean;
}

function getPlatform(platform: string) {
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch(arch: string) {
  // platform | tofu-ls  | extension platform | vs code editor
  //    --    |           --  |         --         | --
  // macOS    | darwin_x86_64  | darwin_x64         | ✅
  // macOS    | darwin_arm64  | darwin_arm64       | ✅
  // Linux    | linux_x86_64   | linux_x64          | ✅
  // Linux    | linux_arm     | linux_armhf        | ✅
  // Linux    | linux_arm64   | linux_arm64        | ✅
  // Windows  | windows_x86_64 | win32_x64          | ✅
  // Windows  | windows_arm64 | win32_arm64        | ✅
  if (arch === 'x64') {
    return 'x86_64';
  }

  if (arch === 'armhf') {
    return 'arm';
  }
  return arch;
}

interface ExtensionInfo {
  name: string;
  extensionVersion: string;
  languageServerVersion: string;
  preview: false;
  syntaxVersion: string;
}

function getExtensionInfo(): ExtensionInfo {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pjson = require('../package.json');
  return {
    name: 'opentofu',
    extensionVersion: pjson.version,
    languageServerVersion: pjson.langServer.version,
    syntaxVersion: pjson.syntax.version,
    preview: pjson.preview,
  };
}

function capitalize(s: string) {
  return String(s[0]).toUpperCase() + String(s).slice(1);
}

async function downloadLanguageServer(platform: string, architecture: string, extInfo: ExtensionInfo) {
  const cwd = path.resolve(__dirname);

  const os = getPlatform(platform);
  const arch = getArch(architecture);

  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'bin');
  const filename = 'tofu-ls';
  const packageName = `tofu-ls_${capitalize(os)}_${arch}`;
  const filePath = path.join(installPath, filename);
  if (fs.existsSync(filePath)) {
    if (process.env.downloader_log === 'true') {
      console.log(`OpenTofu LS exists at ${filePath}. Exiting`);
    }
    return;
  }

  fs.mkdirSync(installPath);

  await fetchVersion({
    repository: 'opentofu/tofu-ls',
    package: packageName,
    destination: installPath,
    fileName: filename,
    version: extInfo.languageServerVersion,
    extract: false,
  });
}

async function downloadFile(url: string, installPath: string) {
  if (process.env.downloader_log === 'true') {
    console.log(`Downloading: ${url}`);
  }

  const buffer = await fileFromUrl(url);
  fs.writeFileSync(installPath, buffer);
  if (process.env.downloader_log === 'true') {
    console.log(`Download completed: ${installPath}`);
  }
}

async function downloadSyntax(info: ExtensionInfo) {
  const release = `v${info.syntaxVersion}`;
  info.name = 'terraform';

  const cwd = path.resolve(__dirname);
  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'syntaxes');

  if (fs.existsSync(installPath)) {
    if (process.env.downloader_log === 'true') {
      console.log(`Syntax path exists at ${installPath}. Removing`);
    }
    fs.rmSync(installPath, { recursive: true });
  }

  fs.mkdirSync(installPath);

  const productName = info.name.replace('-preview', '');
  const terraformSyntaxFile = `${productName}.tmGrammar.json`;
  const hclSyntaxFile = `hcl.tmGrammar.json`;

  let url = `https://github.com/hashicorp/syntax/releases/download/${release}/${terraformSyntaxFile}`;
  await downloadFile(url, path.join(installPath, terraformSyntaxFile));

  url = `https://github.com/hashicorp/syntax/releases/download/${release}/${hclSyntaxFile}`;
  await downloadFile(url, path.join(installPath, hclSyntaxFile));
}

export async function fetchVersion(release: Release): Promise<void> {
  validateRelease(release);
  await downloadRelease(release);
}

function untarFiles(path: string) {
  tar.extract({
    f: path,
    C: 'bin',
  });
}

async function downloadRelease(release: Release) {
  const url = `https://github.com/${release.repository}/releases/download/v${release.version}/${release.package}.tar.gz`;

  console.log('Downloading ', url);

  const fpath = path.join(release.destination, release.fileName);

  try {
    const buffer = await fileFromUrl(url);
    fs.writeFileSync(fpath, buffer);

    if (os !== 'windows' && fpath) {
      fs.chmodSync(fpath, 0o777);
    }

    if (process.env.downloader_log === 'true') {
      console.log(`Download completed`);
    }

    untarFiles(fpath);
  } catch (error) {
    console.log(error);
    throw new Error(`Release download failed version: ${release.version}, fileName: ${release.fileName}`);
  }
}

function validateRelease(release: Release) {
  if (!release.repository) {
    throw new Error('Missing release repository');
  }

  if (!release.package) {
    throw new Error('Missing release package name');
  }

  if (!release.destination) {
    throw new Error('Missing release destination');
  }

  if (!release.version) {
    throw new Error('Missing release version');
  }
}

async function run(platform: string, architecture: string) {
  const extInfo = getExtensionInfo();
  if (process.env.downloader_log === 'true') {
    console.log(extInfo);
  }

  await downloadSyntax(extInfo);

  // we don't download ls for web platforms
  if (os === 'web') {
    return;
  }

  await downloadLanguageServer(platform, architecture, extInfo);
}

let os = process.platform.toString();
let arch = process.arch;

// ls_target=linux_amd64 npm install
//  or
// ls_target=web_noop npm run download:artifacts
const lsTarget = process.env.ls_target;
if (lsTarget !== undefined) {
  const tgt = lsTarget.split('_');
  os = tgt[0];

  arch = tgt[1] as NodeJS.Architecture;
}

run(os, arch);
