/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { logger } from 'pc-nrfconnect-shared';
import treeKill from 'tree-kill';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import nrfutilToolchainManager from './nrfutilToolchainManager';

const noop = () => {};

const removeFromEnv = (keysToRemove: string[]) => {
    const env = { ...process.env };
    keysToRemove.forEach(key => {
        delete env[key];
    });
    return env;
};

const west = (
    westParams: string[],
    version: string,
    signal: AbortSignal,
    onUpdate: (update: string) => void = noop
) =>
    new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
            resolve();
        }

        mkdirSync(sdkPath(version), {
            recursive: true,
        });

        const tcm = spawn(
            nrfutilToolchainManager(),
            [
                'launch',
                '--chdir',
                sdkPath(version),
                '--ncs-version',
                version,
                '--install-dir',
                installDir(),
                '--',
                'west',
                '-v',
                ...westParams,
            ],
            { env: removeFromEnv(['ZEPHYR_BASE']) }
        );

        const abortListener = () => treeKill(tcm.pid);
        signal.addEventListener('abort', abortListener);

        tcm.stderr.on('data', err => logger.debug(err));
        tcm.stdout.on('data', data => {
            logger.debug(data);
            onUpdate(data);
        });
        tcm.on('close', code => {
            signal.removeEventListener('abort', abortListener);

            if (code === 0 || signal.aborted) resolve();
            else reject();
        });
    });

export const westInit = (
    version: string,
    signal: AbortSignal,
    onUpdate?: (update: string) => void
) =>
    west(
        [
            'init',
            '-m',
            'https://github.com/nrfconnect/sdk-nrf',
            '--mr',
            version,
        ],
        version,
        signal,
        onUpdate
    );

export const westUpdate = (
    version: string,
    signal: AbortSignal,
    onUpdate?: (update: string) => void
) => west(['update'], version, signal, onUpdate);

export const westExport = (
    version: string,
    signal: AbortSignal,
    onUpdate?: (update: string) => void
) => west(['zephyr-export'], version, signal, onUpdate);
