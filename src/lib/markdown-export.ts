import type { ExtractionResult } from "./types";

function yamlColorBlock(result: ExtractionResult): string {
  return result.deterministic.palette
    .map((c) => `  ${c.role}: "${c.hex}"`)
    .join("\n");
}

/**
 * Front-matter is machine-parseable (agent/CSS consumption); body is
 * human-readable vocabulary plus a ready-to-paste implementation brief.
 * Mirrors the schema agreed in the v1 scope: structured tokens + narrative.
 */
export function toMarkdown(result: ExtractionResult): string {
  const { deterministic, inferred } = result;

  return `---
domain: ${inferred.domain}
colors:
${yamlColorBlock(result)}
type_scale:
  display: "${inferred.typeScale.display}"
  body: "${inferred.typeScale.body}"
spacing_scale: [${inferred.spacingScale.join(", ")}]
grid: "${inferred.grid}"
---

## Colors

${deterministic.palette.map((c) => `- **${c.role}**: \`${c.hex}\``).join("\n")}

${deterministic.contrastNotes}

## Style vocabulary

${inferred.styleVocabulary.join(", ")}

## Brief for implementation

${inferred.brief}
`;
}
