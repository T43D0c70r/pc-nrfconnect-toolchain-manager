/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    describeError,
    ErrorDialogActions,
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { getAbortController } from '../../../globalAbortControler';
import {
    persistedShowVsCodeDialogDuringInstall,
    setPersistedShowVsCodeDialogDuringInstall,
} from '../../../persistentStore';
import { Environment, RootState } from '../../../state';
import { getVsCodeStatus } from '../../../VsCodeDialog/vscode';
import {
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeStatus,
} from '../../../VsCodeDialog/vscodeSlice';
import toolchainPath from '../../toolchainPath';
import checkXcodeCommandLineTools from './checkXcodeCommandLineTools';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { installToolchain } from './installToolchain';
import { removeUnfinishedInstallOnAbort } from './removeEnvironment';

export const install =
    (
        { version }: Environment,
        justUpdate: boolean
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const abortController = getAbortController();
        logger.info(`Start to install toolchain ${version}`);

        if (persistedShowVsCodeDialogDuringInstall()) {
            dispatch(getVsCodeStatus()).then(status => {
                dispatch(setVsCodeStatus(status));
                if (status === VsCodeStatus.NOT_INSTALLED) {
                    dispatch(showVsCodeDialog());
                }
            });
            setPersistedShowVsCodeDialogDuringInstall(false);
        }

        try {
            await dispatch(
                ensureCleanTargetDir(version, await toolchainPath(version))
            );
            await dispatch(installToolchain(version, abortController));
            await dispatch(cloneNcs(version, justUpdate, abortController));

            if (abortController.signal.aborted) {
                dispatch(removeUnfinishedInstallOnAbort(version));
                return;
            }

            try {
                dispatch(checkXcodeCommandLineTools());
            } catch (error) {
                logger.error(describeError(error));
            }
        } catch (error) {
            if (abortController.signal.aborted) {
                dispatch(removeUnfinishedInstallOnAbort(version));
                return;
            }

            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(message));
            usageData.sendErrorReport(message);
        }
    };
