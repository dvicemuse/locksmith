const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/locksmith-icon',
    extraResource: [
      './scripts',
      //'./scripts/production-check',
      './src/locksmith-icon.png',
      './src/locksmith-icon.ico',
      './src/locksmith-icon-32.ico'
    ],
    ignore: [
      './out',
      './node_modules',
      './dist'
    ],
    appCategoryType: 'public.app-category.developer-tools'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        icon: './src/locksmith-icon-32.ico'
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        //background: './assets/dmg-background.png',
        icon: './src/locksmith-icon.icns',
        format: 'ULFO'
      }
    },
    /*{
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    */
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon: './src/locksmith-icon.png',
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        icon: './src/locksmith-icon.png',
      },
    },
  ],
  /*
  hooks: {
    postPackage: async (forgeConfig, options) => {
      console.info('Packages built at:', options.outputPaths);
      console.info(options);
      if(options.platform == 'win32'){
        const packagePath = options.outputPaths[0];
        const outputPath = packagePath.replace('.exe', '-Setup.exe');

        var version = "2.0.0";
        var iconName = "locksmith-icon-32.ico";
        var icon = packagePath+"\\resources\\"+iconName;

        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });

        var name = "Locksmith";
        var content = '#define MyAppName "'+name+'"'+"\n"+
          '#define MyAppVersion "'+version+'"'+"\n"+
          '#define MyAppExeName "'+name+'.exe"'+"\n"+
          '#define InDir "'+packagePath+'"'+"\n"+
          '#define OutDir "'+packagePath+'\\..\\"'+"\n"+
          '#define IconPath "'+icon+'"'+"\n"+
          '#define iconName "'+iconName+'"'+"\n"+
          "\n"+
          '[Setup]'+"\n"+
          'AppId={{'+guid+"}\n"+
          'AppName={#MyAppName}'+"\n"+
          'AppVersion={#MyAppVersion}'+"\n"+
          'DefaultDirName={autopf}\\{#MyAppName}'+"\n"+
          'ArchitecturesAllowed=x64compatible'+"\n"+
          'ArchitecturesInstallIn64BitMode=x64compatible'+"\n"+
          'DisableProgramGroupPage=yes'+"\n"+
          'PrivilegesRequiredOverridesAllowed=dialog'+"\n"+
          'OutputDir={#OutDir}'+"\n"+
          'OutputBaseFilename={#MyAppName}-Setup-{#MyAppVersion}-Windows-x64'+"\n"+
          'SetupIconFile={#IconPath}'+"\n"+
          'Compression=lzma'+"\n"+
          'SolidCompression=yes'+"\n"+
          'WizardStyle=modern'+"\n"+
          "\n"+
          '[Languages]'+"\n"+
          'Name: "english"; MessagesFile: "compiler:Default.isl"'+"\n"+
          "\n"+
          '[Tasks]'+"\n"+
          'Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked'+"\n"+
          "\n"+
          '[Files]'+"\n"+
          'Source: "{#InDir}\\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion'+"\n"+
          'Source: "{#InDir}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs'+"\n"+
          ''+"\n"+
          '[Icons]'+"\n"+
          'Name: "{autoprograms}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"'+"\n"+
          'Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon'+"\n"+
          ''+"\n"+
          '[Run]'+"\n"+
          'Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, \'&\', \'&&\')}}"; Flags: nowait postinstall skipifsilent';

        require('fs').writeFile(packagePath+"\\..\\installer-script.iss", content, function(err) {
            if(err) {
                return console.error(err);
            }
            require('child_process').execFile("cmd.exe", ['/c', "issc "+packagePath+"\\..\\installer-script.iss"]);
            console.log("The file was saved!");
        });
      }
    }
  },
  */
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
