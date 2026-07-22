import AppIntents
import WidgetKit

/// Logs a preset straight from the widget without opening the app (iOS 17+).
/// Queues the add for the app to persist, and optimistically bumps the widget's
/// displayed totals so the UI updates immediately.
struct QuickAddIntent: AppIntent {
  static var title: LocalizedStringResource = "Quick add nutrition"

  @Parameter(title: "Preset ID")
  var presetId: String

  init() {}
  init(presetId: String) { self.presetId = presetId }

  func perform() async throws -> some IntentResult {
    var snap = SharedStore.loadSnapshot()
    if let preset = snap.presets.first(where: { $0.id == presetId }) {
      SharedStore.appendPending(preset)
      snap.calories += preset.calories
      snap.protein += preset.protein
      SharedStore.saveSnapshot(snap)
    }
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}
