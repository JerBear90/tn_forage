"use client";

const PHOTO_CHECKLIST = [
  { id: "top", label: "Top of cap (bird's eye view)", tip: "Show color, texture, and shape from directly above" },
  { id: "underside", label: "Underside (gills/pores/teeth)", tip: "Tilt to show gill attachment, spacing, and color" },
  { id: "stem", label: "Full stem including base", tip: "Dig gently to expose the base — check for volva or bulb" },
  { id: "cross-section", label: "Cross-section (cut in half)", tip: "Show flesh color, hollow vs solid, any color changes" },
  { id: "habitat", label: "Habitat context (wide shot)", tip: "Include surrounding trees, substrate, and growth pattern" },
  { id: "scale", label: "Size reference (coin or hand)", tip: "Place a coin or your hand next to the specimen for scale" },
];

/**
 * Field photography guide with checklist and tips for each recommended angle.
 * Requirements: 33.1–33.5
 */
export default function FieldPhotographyGuide() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Photography Guide</h3>
      <p className="text-xs text-gray-600 mb-3">
        Good photos are essential for identification. Capture these angles:
      </p>

      <ul className="space-y-3">
        {PHOTO_CHECKLIST.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-teal-300 text-xs text-teal-600">
              📷
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.tip}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-2">
        <p className="text-xs text-amber-800">
          <strong>Tip:</strong> Natural lighting works best. Avoid flash which can wash out colors.
          Include multiple specimens if available to show variation.
        </p>
      </div>
    </div>
  );
}
