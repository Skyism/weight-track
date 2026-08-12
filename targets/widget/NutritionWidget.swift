import AppIntents
import SwiftUI
import WidgetKit

struct NutritionEntry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> NutritionEntry {
    NutritionEntry(date: Date(), snapshot: .empty)
  }
  func getSnapshot(in context: Context, completion: @escaping (NutritionEntry) -> Void) {
    completion(NutritionEntry(date: Date(), snapshot: SharedStore.loadSnapshot()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<NutritionEntry>) -> Void) {
    let entry = NutritionEntry(date: Date(), snapshot: SharedStore.loadSnapshot())
    completion(Timeline(entries: [entry], policy: .never))
  }
}

private let ink = Color(red: 0.094, green: 0.094, blue: 0.106)
private let accent = Color(red: 0.898, green: 0.282, blue: 0.302)
private let faint = Color(red: 0.604, green: 0.604, blue: 0.62)

struct MacroRow: View {
  let label: String
  let value: Double
  let target: Double
  let suffix: String
  let overIsBad: Bool

  private var pct: CGFloat {
    target > 0 ? min(1, CGFloat(value / target)) : 0
  }
  private var over: Bool { target > 0 && value > target }

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack {
        Text(label.uppercased())
          .font(.system(size: 10, weight: .semibold))
          .kerning(0.8)
          .foregroundStyle(faint)
        Spacer()
        Text("\(Int(value)) / \(Int(target)) \(suffix)")
          .font(.system(size: 12, weight: .medium, design: .monospaced))
          .foregroundStyle(ink)
      }
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(faint.opacity(0.25)).frame(height: 5)
          Capsule()
            .fill(over && overIsBad ? accent : ink)
            .frame(width: geo.size.width * pct, height: 5)
        }
      }
      .frame(height: 5)
    }
  }
}

struct QuickButton: View {
  let preset: Preset
  var body: some View {
    Button(intent: QuickAddIntent(presetId: preset.id)) {
      VStack(spacing: 1) {
        Text(preset.name)
          .font(.system(size: 11, weight: .semibold))
          .lineLimit(1)
        Text("+\(Int(preset.calories))")
          .font(.system(size: 10, weight: .regular, design: .monospaced))
          .foregroundStyle(faint)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 8)
      .background(
        RoundedRectangle(cornerRadius: 8).stroke(faint.opacity(0.4), lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
    .foregroundStyle(ink)
  }
}

struct NutritionWidgetEntryView: View {
  var entry: NutritionEntry

  var body: some View {
    let snap = entry.snapshot
    VStack(alignment: .leading, spacing: 10) {
      MacroRow(label: "Calories", value: snap.calories, target: snap.calorieTarget, suffix: "kcal", overIsBad: true)
      MacroRow(label: "Protein", value: snap.protein, target: snap.proteinTarget, suffix: "g", overIsBad: false)
      if !snap.presets.isEmpty {
        HStack(spacing: 6) {
          ForEach(snap.presets.prefix(3)) { preset in
            QuickButton(preset: preset)
          }
        }
      }
    }
    .containerBackground(.white, for: .widget)
  }
}

@main
struct NutritionWidgetBundle: WidgetBundle {
  var body: some Widget {
    NutritionWidget()
  }
}

struct NutritionWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NutritionWidget", provider: Provider()) { entry in
      NutritionWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Nutrition")
    .description("Log calories & protein from the Home Screen.")
    .supportedFamilies([.systemMedium])
  }
}
