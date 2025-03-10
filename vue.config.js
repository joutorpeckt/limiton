module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.limiton.app',
        productName: 'Лимитон',
        copyright: 'Copyright © 2024',
        mac: {
          icon: 'build/icon.icns',
          category: 'public.app-category.productivity'
        },
        win: {
          icon: 'build/icon.ico',
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            }
          ]
        },
        linux: {
          icon: 'build/icon.png',
          category: 'Utility'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'Лимитон'
        }
      }
    }
  }
} 