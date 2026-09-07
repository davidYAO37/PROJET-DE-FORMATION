const RTF_DESTINATIONS = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'generator', 'pict', 'object', 'header', 'footer']);

function rtfToText(value) {
  const input = String(value ?? '');
  if (!/^\s*\{\\rtf/i.test(input)) return input;
  const output = [];
  const skippedGroups = [];
  let skipGroup = false;

  for (let index = 0; index < input.length;) {
    const character = input[index];
    if (character === '{') {
      const groupStart = input.slice(index + 1).match(/^\s*(?:\\\*\s*)?\\([a-z]+)/i);
      skippedGroups.push(skipGroup);
      skipGroup = skipGroup || Boolean(groupStart && RTF_DESTINATIONS.has(groupStart[1].toLowerCase()));
      index++;
      continue;
    }
    if (character === '}') {
      skipGroup = skippedGroups.pop() ?? false;
      index++;
      continue;
    }
    if (character !== '\\') {
      if (!skipGroup) output.push(character);
      index++;
      continue;
    }
    if (input[index + 1] === "'") {
      const hex = input.slice(index + 2, index + 4);
      if (!skipGroup && /^[0-9a-f]{2}$/i.test(hex)) output.push(new TextDecoder('windows-1252').decode(new Uint8Array([parseInt(hex, 16)])));
      index += 4;
      continue;
    }
    const control = input.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i);
    if (control) {
      const word = control[1].toLowerCase();
      if (!skipGroup) {
        if (word === 'par' || word === 'line') output.push('\n');
        if (word === 'tab') output.push('\t');
        if (word === 'u' && control[2]) {
          const codePoint = Number(control[2]);
          output.push(String.fromCharCode(codePoint < 0 ? codePoint + 65536 : codePoint));
        }
      }
      index += 1 + control[0].length;
      if (word === 'u' && input[index] === '?') index++;
      continue;
    }
    const escaped = input[index + 1];
    if (!skipGroup && ['\\', '{', '}', '~', '-', '_'].includes(escaped)) output.push(escaped === '~' ? ' ' : escaped);
    index += 2;
  }

  return output.join('').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

module.exports = { rtfToText };
