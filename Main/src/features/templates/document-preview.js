"use client";
import { useId } from "react";
import { wrapText, browserMeasure } from "@/lib/templates/fitting";
export function DocumentPreview({
  document: doc,
  label = "Editable design preview",
}) {
  const prefix = useId().replaceAll(":", "");
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${doc.canvas.width} ${doc.canvas.height}`}
      className="template-document-preview"
    >
      <rect
        width={doc.canvas.width}
        height={doc.canvas.height}
        fill={doc.canvas.background}
      />
      {doc.elements.map((e) => {
        const transform = `translate(${e.x} ${e.y}) rotate(${e.rotation})`;
        if (e.type === "text") {
          const lines = wrapText(
            e.text,
            e.width,
            e.fontSize,
            e.fontFamily,
            e.fontWeight,
            browserMeasure,
          );
          return (
            <g key={e.id} transform={transform} opacity={e.opacity}>
              <text
                fill={e.fill}
                fontFamily={e.fontFamily}
                fontWeight={e.fontWeight}
                fontSize={e.fontSize}
                textAnchor={
                  e.align === "center"
                    ? "middle"
                    : e.align === "right"
                      ? "end"
                      : "start"
                }
              >
                {lines.map((line, i) => (
                  <tspan
                    key={i}
                    x={
                      e.align === "center"
                        ? e.width / 2
                        : e.align === "right"
                          ? e.width
                          : 0
                    }
                    y={e.fontSize * 0.85 + i * e.fontSize * e.lineHeight}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        }
        if (e.type === "image") {
          const a = doc.assets[e.assetId],
            clip = `${prefix}-${e.id}`;
          return (
            <g key={e.id} transform={transform} opacity={e.opacity}>
              <defs>
                <clipPath id={clip}>
                  <rect width={e.width} height={e.height} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clip})`}>
                <image
                  href={a.src}
                  x={(-e.crop.x * e.width) / e.crop.width}
                  y={(-e.crop.y * e.height) / e.crop.height}
                  width={e.width / e.crop.width}
                  height={e.height / e.crop.height}
                  preserveAspectRatio="none"
                />
              </g>
            </g>
          );
        }
        return (
          <g key={e.id} transform={transform} opacity={e.opacity}>
            {e.type === "ellipse" ? (
              <ellipse
                cx={e.width / 2}
                cy={e.height / 2}
                rx={e.width / 2}
                ry={e.height / 2}
                fill={e.fill}
                stroke={e.stroke}
                strokeWidth={e.strokeWidth}
              />
            ) : (
              <rect
                width={e.width}
                height={e.height}
                rx={e.cornerRadius}
                fill={e.fill}
                stroke={e.stroke}
                strokeWidth={e.strokeWidth}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
