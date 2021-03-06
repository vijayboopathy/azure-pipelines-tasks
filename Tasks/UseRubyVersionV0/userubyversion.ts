import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as task from 'vsts-task-lib/task';
import * as tool from 'vsts-task-tool-lib/tool';

export enum Platform {
    Windows,
    MacOS,
    Linux
}

export function getPlatform(): Platform {
    switch (process.platform) {
        case 'win32': return Platform.Windows;
        case 'darwin': return Platform.MacOS;
        case 'linux': return Platform.Linux;
        default: throw Error(task.loc('PlatformNotRecognized'));
    }
}

interface TaskParameters {
    readonly versionSpec: string;
    readonly addToPath: boolean;
}

export async function useRubyVersion(parameters: TaskParameters, platform: Platform): Promise<void> {
    const toolName: string = 'Ruby';
    const installDir: string | null = tool.findLocalTool(toolName, parameters.versionSpec);
    if (!installDir) {
        // Fail and list available versions
        throw new Error([
            task.loc('VersionNotFound', parameters.versionSpec),
            task.loc('ListAvailableVersions', task.getVariable('Agent.ToolsDirectory')),
            tool.findLocalToolVersions('Ruby'),
            task.loc('ToolNotFoundMicrosoftHosted', 'Ruby', 'https://aka.ms/hosted-agent-software'),
            task.loc('ToolNotFoundSelfHosted', 'Ruby', 'https://go.microsoft.com/fwlink/?linkid=2005989')
        ].join(os.EOL));
    }

    const toolPath: string = path.join(installDir, 'bin');
    if (platform !== Platform.Windows) {
        // Ruby / Gem heavily use the '#!/usr/bin/ruby' to find ruby, so this task needs to
        // replace that version of ruby so all the correct version of ruby gets selected
        // replace the default
        const dest: string = '/usr/bin/ruby';
        task.execSync('sudo', `ln -sf ${path.join(toolPath, 'ruby')} ${dest}`); // replace any existing
    }

    task.setVariable('rubyLocation', toolPath);
    if (parameters.addToPath) {
        tool.prependPath(toolPath);
    }
}
