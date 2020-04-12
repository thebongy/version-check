import * as core from '@actions/core';
import * as toml from 'toml';
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

        const fileName = path.basename(file).toLowerCase();
        core.info(`Reading ${file}`);
        const fileData = await readFilePromise(file, 'utf8');
        let version;

        switch (fileName) {
            case 'package.json':
                core.info('Parsing NodeJS package.json');
                version = JSON.parse(fileData).version;
                break;
            case 'cargo.toml':
                core.info('Parsing Rust Cargo.toml file');
                version = toml.parse(fileData).package.version;
                break;
            default:
                core.setFailed(`Unsupported file type ${file}`);
                break;
        }

        core.info(`Version in file: ${version}`);

        // eslint-disable-next-line no-template-curly-in-string
        version = tagFormat.replace('${version}', version);

        core.info(`Current Tag: ${version}`);

        core.info('Obtaining repo tags');
        const tags = await getRepoTags();
        core.info(`Repo has tags: ${tags.join(' ')}`);

        if (tags.indexOf(version) > -1) {
            core.setFailed(`Tag ${version} already exists in repo`);
        } else {
            core.info(`${version} is a new tag, all set to publish new release!`);
            core.setOutput('releaseVersion', version);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
