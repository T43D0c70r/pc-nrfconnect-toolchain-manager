/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { showConfirmInstallDirDialog } from '../../InstallDir/installDirSlice';
import { Environment } from '../../state';
import { isAnyToolchainInProgress } from '../managerSlice';
import Button from './Button';
import { install } from './effects/installEnvironment';
import { isOnlyAvailable, version } from './environmentReducer';

type Props = { environment: Environment };

const Install = ({ environment }: Props) => {
    const dispatch = useDispatch();
    const anyInProgress = useSelector(isAnyToolchainInProgress);

    const { platform } = process;
    const onClick = (() => {
        switch (platform) {
            case 'darwin':
                return () => dispatch(install(environment, false));
            case 'linux':
                return () =>
                    dispatch(showConfirmInstallDirDialog(version(environment)));
            case 'win32':
                return () =>
                    dispatch(showConfirmInstallDirDialog(version(environment)));
        }
    })();

    return !isOnlyAvailable(environment) ? null : (
        <Button
            icon="x-mdi-briefcase-download-outline"
            onClick={onClick}
            label="Install"
            variant="secondary"
            disabled={anyInProgress}
        />
    );
};

export default Install;
