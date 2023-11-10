/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getNrfutilLogger } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/nrfutilLogger';

import { getToolChainManagerSandbox } from './common';

export default async (
    asScript: 'cmd' | 'sh',
    ncsVersion: string,
    installDir: string,
    controller?: AbortController
) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = [
        '--as-script',
        asScript,
        '--ncs-version',
        ncsVersion,
        '--install-dir',
        installDir,
    ];

    let result: string | undefined;

    await box.execCommand(
        box.getNrfutilExePath(),
        [box.module, 'env', ...args],
        data => {
            result = data.toString();
        },
        error => {
            getNrfutilLogger()?.error(error.toString());
        },
        controller
    );

    if (!result) {
        throw new Error('No output from nrfutil');
    }

    return result;
};
