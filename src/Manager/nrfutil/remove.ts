/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import handleChunk from './handleChunk';
import { nrfutilSpawn } from './nrfutilChildProcess';
import type { TaskEvent } from './task';

const noop = () => {};
export default (
    version: string,
    onUpdate: (update: TaskEvent) => void = noop
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = nrfutilSpawn([
            'remove',
            '--install-dir',
            installDir(),
            version,
        ]);

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', code => (code === 0 ? resolve() : reject(error)));
    });
