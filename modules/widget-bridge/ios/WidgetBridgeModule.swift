import ExpoModulesCore
import WidgetKit

// Must match the App Group in app.json (ios.entitlements) and the widget target.
private let APP_GROUP = "group.com.skyism.weighttrack"

public class WidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    Function("setItem") { (key: String, value: String) in
      UserDefaults(suiteName: APP_GROUP)?.set(value, forKey: key)
    }

    Function("getItem") { (key: String) -> String? in
      return UserDefaults(suiteName: APP_GROUP)?.string(forKey: key)
    }

    Function("reloadWidgets") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
