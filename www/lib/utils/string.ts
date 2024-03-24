/**
 * Find the maximum common leading space in a multiline string and remove it.
 */
export const removeLeadingSpace = (str: string) => {
  const lines = str.split("\n");

  let maxSpaces = Infinity;
  for (const line of lines) {
    const match = line.match(/^(\s*)([^\s])?/);
    const isAllWhitespace = match?.[2] === undefined;
    if (isAllWhitespace) continue;
    const spaceCount = match[1].length;
    if (spaceCount < maxSpaces) maxSpaces = spaceCount;
  }

  if (maxSpaces === Infinity) {
    return str;
  }

  return lines.map((line) => line.slice(maxSpaces)).join("\n");
};
