/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'NutritionWidget',
  deploymentTarget: '17.0',
  frameworks: ['WidgetKit', 'SwiftUI', 'AppIntents'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.skyism.weighttrack'],
  },
};
