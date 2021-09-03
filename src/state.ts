import { NrfConnectState } from 'pc-nrfconnect-shared';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { FirstInstallState } from './FirstInstall/firstInstallReducer';
import { InstallDirectoryState } from './InstallDir/installDirReducer';
import { ConfirmDialogState } from './ReduxConfirmDialog/reduxConfirmDialogReducer';
import { ToolChainSourceState as ToolchainSourceState } from './ToolchainSource/toolchainSourceReducer';

export type Toolchain = {
    version: string;
    name: string;
    sha512: string;
    uri?: string;
};

export type Environment = {
    version: string;
    toolchainDir: string;
    isWestPresent?: boolean;
    isInstalled?: boolean;
    toolchains: Toolchain[];
    isInstallingToolchain?: boolean;
    isCloningSdk?: boolean;
    isRemoving?: boolean;
    progress?: number;
    stage?: 'Downloading' | 'Installing';
};
export type Environments = {
    [key: string]: Environment;
};

export type Manager = {
    environments: Environments;
    dndPackage: string | null;
    isRemoveDirDialogVisible: boolean;
    isInstallPackageDialogVisible: boolean;
    isMasterVisible: boolean;
    isVsCodeVisible: boolean;
    isShowingFirstSteps: boolean;
    versionToRemove: string;
    selectedVersion?: string;
};

export type AppState = {
    firstInstall: FirstInstallState;
    installDir: InstallDirectoryState;
    manager: Manager;
    toolchainSource: ToolchainSourceState;
    reduxConfirmDialog: ConfirmDialogState;
};

export type RootState = NrfConnectState<AppState>;
export type Dispatch = ThunkDispatch<RootState, null, AnyAction>;