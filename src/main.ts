import * as core from '@actions/core';
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

async function getRepoTags(): Promise<string[]> {
    return (await executeCommand('git tag')).split('\n');
}

async function run(): Promise<void> {
    try {
        const jsonFile: string = core.getInput('file');
        core.info(`Reading json from ${jsonFile}`);

        const { version } = JSON.parse(await readFilePromise(jsonFile, 'utf8'));
        core.info(`Read json version ${version}`);

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
