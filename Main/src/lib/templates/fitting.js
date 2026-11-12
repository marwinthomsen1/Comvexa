// Shared explicit line fitting for generation, previews, canvas and exports.
export function approximateMeasure(text, size) {
  return [...text].reduce(
    (sum, c) =>
      sum +
      (/[MW@#%]/.test(c) ? 0.9 : /[il.,!' ]/.test(c) ? 0.28 : 0.58) * size,
    0,
  );
}
export function browserMeasure(text, size, font = "Arial", weight = "normal") {
  const canvas =
    browserMeasure.canvas ||
    (browserMeasure.canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = `${weight} ${size}px ${font}`;
  return ctx.measureText(text).width;
}
export function wrapText(
  text,
  width,
  size,
  font,
  weight,
  measure = approximateMeasure,
) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, size, font, weight) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = "";
        for (const character of word) {
          if (line && measure(line + character, size, font, weight) > width) {
            lines.push(line);
            line = "";
          }
          line += character;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}
export function fitText(
  text,
  box,
  {
    font = "Arial",
    weight = "normal",
    max = 90,
    min = 24,
    lineHeight = 1.12,
    measure = approximateMeasure,
  } = {},
) {
  for (let size = max; size >= min; size -= 1) {
    if (
      text
        .split(/\s+/)
        .some((word) => measure(word, size, font, weight) > box.width)
    )
      continue;
    const lines = wrapText(text, box.width, size, font, weight, measure);
    if (lines.length * size * lineHeight <= box.height)
      return {
        text: lines.join("\n"),
        fontSize: size,
        lineHeight,
        overflow: false,
      };
  }
  return {
    text: wrapText(text, box.width, min, font, weight, measure).join("\n"),
    fontSize: min,
    lineHeight,
    overflow: true,
  };
}
export function documentWarnings(doc, measure = approximateMeasure) {
  return doc.elements
    .filter(
      (e) =>
        e.type === "text" &&
        wrapText(
          e.text,
          e.width,
          e.fontSize,
          e.fontFamily,
          e.fontWeight,
          measure,
        ).length *
          e.fontSize *
          e.lineHeight >
          e.height + 1,
    )
    .map(
      (e) =>
        `Text “${e.text.replaceAll("\n", " ").slice(0, 45)}” may overflow its frame. Enlarge the frame or reduce the font size.`,
    );
}
export function coverCrop(asset, width, height) {
  const source = asset.width / asset.height,
    target = width / height;
  if (source > target) {
    const w = target / source;
    return { x: (1 - w) / 2, y: 0, width: w, height: 1 };
  }
  const h = source / target;
  return { x: 0, y: (1 - h) / 2, width: 1, height: h };
}
