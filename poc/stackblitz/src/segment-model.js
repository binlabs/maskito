/**
 * Segment model for the DateKit segment-navigation PoC.
 *
 * Pure, framework-free helpers that map a date mask's "mode" string
 * and a caret index onto the active date segment and its bounds.
 *
 * @typedef {'day' | 'month' | 'year'} DateSegmentName
 * @typedef {{name: DateSegmentName, from: number, to: number}} SegmentBounds
 */

/** @type {Readonly<Record<string, DateSegmentName>>} */
const LETTER_TO_SEGMENT = {
    d: 'day',
    m: 'month',
    y: 'year',
};

/**
 * Split a mode string into its ordered date segments. A segment is a maximal
 * run of the same `d`/`m`/`y` letter; any other character is a separator.
 *
 * @param {string} mode
 * @returns {SegmentBounds[]}
 */
export function getSegments(mode) {
    /** @type {SegmentBounds[]} */
    const segments = [];
    let index = 0;

    while (index < mode.length) {
        const letter = mode[index];
        const name = LETTER_TO_SEGMENT[letter];

        if (!name) {
            index += 1;
            continue;
        }

        const from = index;

        while (index < mode.length && mode[index] === letter) {
            index += 1;
        }

        segments.push({name, from, to: index});
    }

    return segments;
}

/**
 * The segment the caret sits in. A caret on a separator resolves to the
 * preceding segment (its `to`); a caret immediately after a separator resolves
 * to the following segment (its `from`). Returns `null` only for a mode with no
 * segments at all.
 *
 * @param {string} mode
 * @param {number} caret
 * @returns {SegmentBounds | null}
 */
export function getActiveSegment(mode, caret) {
    const segments = getSegments(mode);

    for (const segment of segments) {
        if (caret >= segment.from && caret <= segment.to) {
            return segment;
        }
    }

    // Caret landed in a separator gap wider than expected: snap to the nearest
    // preceding segment, else the first segment.
    /** @type {SegmentBounds | null} */
    let best = null;

    for (const segment of segments) {
        if (segment.to <= caret) {
            best = segment;
        }
    }

    return best ?? segments[0] ?? null;
}

/**
 * The segment adjacent to the caret's active segment. `direction` is `1` for
 * the next segment (Tab) or `-1` for the previous one (Shift+Tab). Returns
 * `null` when there is no segment in that direction, so the caller can let the
 * browser's native focus move handle Tab out of the field.
 *
 * @param {string} mode
 * @param {number} caret
 * @param {1 | -1} direction
 * @returns {SegmentBounds | null}
 */
export function getAdjacentSegment(mode, caret, direction) {
    const segments = getSegments(mode);
    const active = getActiveSegment(mode, caret);

    if (!active) {
        return null;
    }

    const activeIndex = segments.findIndex(
        (segment) => segment.from === active.from && segment.to === active.to,
    );

    return segments[activeIndex + direction] ?? null;
}
