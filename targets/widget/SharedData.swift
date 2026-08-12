import Foundation

// Must match app.json (ios.entitlements) and modules/widget-bridge.
let APP_GROUP = "group.com.skyism.weighttrack"

struct Preset: Codable, Identifiable {
  let id: String
  let name: String
  let calories: Double
  let protein: Double
}

struct Snapshot: Codable {
  var date: String
  var calories: Double
  var protein: Double
  var calorieTarget: Double
  var proteinTarget: Double
  var presets: [Preset]

  static let empty = Snapshot(
    date: "", calories: 0, protein: 0,
    calorieTarget: 2000, proteinTarget: 160, presets: []
  )
}

enum SharedStore {
  static var defaults: UserDefaults? { UserDefaults(suiteName: APP_GROUP) }

  static func loadSnapshot() -> Snapshot {
    guard
      let raw = defaults?.string(forKey: "snapshot"),
      let data = raw.data(using: .utf8),
      let snap = try? JSONDecoder().decode(Snapshot.self, from: data)
    else { return .empty }
    return snap
  }

  static func saveSnapshot(_ snap: Snapshot) {
    guard let data = try? JSONEncoder().encode(snap),
          let str = String(data: data, encoding: .utf8) else { return }
    defaults?.set(str, forKey: "snapshot")
  }

  /// Append a quick-add the app will import on next foreground.
  static func appendPending(_ preset: Preset) {
    var arr: [[String: Any]] = []
    if let raw = defaults?.string(forKey: "pending"),
       let data = raw.data(using: .utf8),
       let parsed = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] {
      arr = parsed
    }
    arr.append([
      "id": UUID().uuidString,
      "calories": preset.calories,
      "protein": preset.protein,
      "presetName": preset.name,
    ])
    if let data = try? JSONSerialization.data(withJSONObject: arr),
       let str = String(data: data, encoding: .utf8) {
      defaults?.set(str, forKey: "pending")
    }
  }
}
