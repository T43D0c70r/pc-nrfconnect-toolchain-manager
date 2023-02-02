/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { existsSync, renameSync, rmSync } from 'fs';
import { rm } from 'fs/promises';
import path from 'path';
import { ErrorDialogActions, logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import removeToolchain from '../../nrfutil/remove';
import sdkPath from '../../sdkPath';
import toolchainPath from '../../toolchainPath';
import {
    finishCancelInstall,
    finishRemoving,
    isLegacyEnvironment,
    removeEnvironmentReducer,
    startCancelInstall,
    startRemoving,
} from '../environmentReducer';
import { removeDir } from './removeDir';

const removeLegacyEnvironment = (toolchainDir: string) =>
    removeDir(path.dirname(toolchainDir));

const renamedPath = (origPath: string) =>
    path.resolve(origPath, '..', 'toBeDeleted');
const removeNrfutilEnvironment = (version: string) => {
    let currentPath;
    try {
        currentPath = sdkPath(version);
        renameSync(currentPath, renamedPath(currentPath));
        renameSync(renamedPath(currentPath), currentPath);

        // Toolchain folder is deleted through Nrfutil so it requires the original path.
        currentPath = toolchainPath(version);
        renameSync(currentPath, renamedPath(currentPath));
        renameSync(renamedPath(currentPath), currentPath);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${currentPath}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';

        throw new Error(errorMsg);
    }

    try {
        rmSync(sdkPath(version), { recursive: true, force: true });
        removeToolchain(version);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        throw new Error(
            `Unexpected error when removing SDK ${version}, ${message}. ` +
                `Please remove the installation in ${sdkPath(
                    version
                )} and ${toolchainPath(version)} manually as it is broken.`
        );
    }
};

export const removeEnvironment =
    (environment: Environment) => (dispatch: Dispatch) => {
        const { toolchainDir, version } = environment;
        logger.info(`Removing ${version} at ${toolchainDir}`);
        usageData.sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

        dispatch(startRemoving(version));

        try {
            if (isLegacyEnvironment(version)) {
                removeLegacyEnvironment(toolchainDir);
            } else {
                removeNrfutilEnvironment(version);
            }
            logger.info(`Finished removing ${version} at ${toolchainDir}`);
            dispatch(removeEnvironmentReducer(version));
        } catch (err) {
            dispatch(ErrorDialogActions.showDialog((err as Error).message));
            usageData.sendErrorReport((err as Error).message);
        }

        dispatch(finishRemoving(version));
    };

export const removeUnfinishedInstallOnAbort = async (
    dispatch: Dispatch,
    version: string,
    toolchainDir: string
) => {
    dispatch(startCancelInstall(version));
    if (existsSync(toolchainDir)) {
        try {
            await rm(toolchainDir, { recursive: true, force: true });
            logger.info(
                `Successfully removed toolchain directory: ${toolchainDir}`
            );
        } catch (err) {
            logger.error(err);
        }
    }
    if (existsSync(sdkPath(version))) {
        try {
            await rm(sdkPath(version), { recursive: true, force: true });
            logger.info(
                `Successfully removed SDK with version ${version} from ${sdkPath(
                    version
                )}`
            );
        } catch (err) {
            logger.error(err);
        }
    }
    dispatch(finishCancelInstall(version));
};
