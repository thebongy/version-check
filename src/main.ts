import * as core from '@actions/core';
import * as toml from 'smol-toml';
import * as path from 'path';

import { exec } from 'child_process';
import { readFile } from 'fs';
import { promisify } from 'util';

const readFilePromise = promisify(readFile);

async function executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(stderr);
            }
            resolve(stdout);
        });
    });
}

/**
 * Get Tags of repo
 */
async function getRepoTags(): Promise<string[]> {
    return (await executeCommand('git tag')).split('\n');
}

async function run(): Promise<void> {
    try {
        const file: string = core.getInput('file');
        const tagFormat: string = core.getInput('tagFormat');
        const failBuild: string = core.getInput('failBuild');

        const fileName = path.basename(file).toLowerCase();
        core.info(`Reading ${file}`);
        const fileData = await readFilePromise(file, 'utf8');
        let rawVersion = '';
        let changed = false;
        switch (fileName) {
            case 'package.json':
                core.info('Parsing NodeJS package.json');
                rawVersion = JSON.parse(fileData).version;
                break;
            case 'cargo.toml':
                core.info('Parsing Rust Cargo.toml file');
                // eslint-disable-next-line no-case-declarations
                const parsedPackage: Object = toml.parse(fileData).package;
                if ('version' in parsedPackage) {
                    rawVersion = parsedPackage.version as string;
                    break;
                }
                core.setFailed('Cargo.toml did not contain package.version');
                break;
            default:
                core.setFailed(`Unsupported file type ${file}`);
                break;
        }

        core.info(`Version in file: ${rawVersion}`);

        // eslint-disable-next-line no-template-curly-in-string
        const version = tagFormat.replace('${version}', rawVersion);

        core.info(`Current Tag: ${version}`);

        core.info('Obtaining repo tags');
        const tags = await getRepoTags();
        core.info(`Repo has tags: ${tags.join(' ')}`);

        if (tags.indexOf(version) > -1) {
            changed = false;
            if (failBuild.toLowerCase() === 'false') {
                core.warning(`Tag ${version} already exists in repo`);
            } else {
                core.setFailed(`Tag ${version} already exists in repo`);
            }
        } else {
            changed = true;
            core.info(`${version} is a new tag, all set to publish new release!`);
        }
        core.setOutput('rawVersion', rawVersion);
        core.setOutput('versionChanged', changed.toString());
        core.setOutput('releaseVersion', version);
        core.setOutput(
            'releaseTags',
            rawVersion
                .split('.')
            // eslint-disable-next-line no-template-curly-in-string
                .map((_, i, versions) => tagFormat.replace('${version}', versions.slice(0, i + 1).join('.')))
                .join(','),
        );
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

run();
