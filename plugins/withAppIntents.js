// Adds native/ios/FakkaIntents.swift (the "Log Bank SMS" Shortcuts action) to the iOS app target.
// App Intents must live in the app itself (not in a pod) for iOS to list them in the Shortcuts app.
const { withDangerousMod, withXcodeProject, IOSConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FILE = 'FakkaIntents.swift';

module.exports = function withAppIntents(config) {
  config = withDangerousMod(config, ['ios', async c => {
    const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    fs.copyFileSync(path.join(c.modRequest.projectRoot, 'native', 'ios', FILE), path.join(c.modRequest.platformProjectRoot, name, FILE));
    return c;
  }]);
  return withXcodeProject(config, c => {
    const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    const filepath = `${name}/${FILE}`;
    if (!c.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: name, project: c.modResults });
    }
    return c;
  });
};
