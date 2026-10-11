import {Maskito, maskitoUpdateElement} from '@maskito/core';
import {maskitoDate, maskitoWithPlaceholder} from '@maskito/kit';

import {
    getActiveSegment,
    getAdjacentSegment,
    getSegments,
} from './segment-model.js';

const MODE = 'dd/mm/yyyy';
const SEPARATOR = '/';
const LABELS = {day: 'Day', month: 'Month', year: 'Year'};
// PoC-simple ranges (real plugin would get day-max from month/year)
const RANGES = {day: [1, 31], month: [1, 12], year: [1, 9999]};

const input = document.getElementById('date');
const announcer = document.getElementById('announcer');

let programmaticValueChange = false;

// Full-width placeholder while focused so every segment holds a stable
// position and is always selectable (mirrors how React Aria keeps all
// segments visible). We drop maskitoWithPlaceholder's caret guard because it pins
// the caret to the typed length and blocks navigation into empty segments.
const dateOptions = maskitoDate({mode: MODE, separator: SEPARATOR});
const {plugins, ...placeholderOptions} = maskitoWithPlaceholder(MODE, true);

new Maskito(input, {
    ...dateOptions,
    plugins: plugins.slice(1).concat(dateOptions.plugins),
    preprocessors: [
        ...placeholderOptions.preprocessors,
        ...dateOptions.preprocessors,
    ],
    postprocessors: [
        ...dateOptions.postprocessors,
        ...placeholderOptions.postprocessors,
    ],
});

function segmentText(segment) {
    return input.value.slice(segment.from, segment.to).replace(/\D/g, '');
}

function announce(segment) {
    const digits = segmentText(segment);

    announcer.textContent = `${LABELS[segment.name]}, ${
        digits === '' ? 'empty' : digits
    }`;
}

function selectSegment(segment) {
    input.setSelectionRange(segment.from, segment.to);
    announce(segment);
}

function wrap(value, min, max) {
    const range = max - min + 1;

    return ((((value - min) % range) + range) % range) + min;
}

function step(segment, delta) {
    const [min, max] = RANGES[segment.name];
    const digits = segmentText(segment);
    const next =
        digits === ''
            ? delta > 0
                ? min
                : max
            : wrap(Number(digits) + delta, min, max);
    const text = String(next).padStart(segment.to - segment.from, '0');
    const value = input.value;
    const nextValue =
        value.slice(0, segment.from) + text + value.slice(segment.to);

    // Go through maskitoUpdateElement so an `input` event fires: maskito re-runs
    // its date validation, framework bindings and mask history stay in sync, and
    // the placeholder plugin doesn't desync. (Same mechanism the Time stepper
    // uses.) This guard keeps the input listener from announcing twice.
    programmaticValueChange = true;
    maskitoUpdateElement(input, {
        value: nextValue,
        selection: [segment.from, segment.to],
    });
    programmaticValueChange = false;

    // maskito's pipeline may have moved the caret; re-assert the segment range
    // and announce the (possibly validation-corrected) value once.
    input.setSelectionRange(segment.from, segment.to);
    announce(segment);
}

function caret() {
    return input.selectionStart ?? 0;
}

input.addEventListener('focus', () => {
    const first = getSegments(MODE)[0];

    if (first) {
        requestAnimationFrame(() => selectSegment(first));
    }
});

input.addEventListener('keydown', (event) => {
    const active = getActiveSegment(MODE, caret());

    if (!active) {
        return;
    }

    switch (event.key) {
        case 'Tab': {
            const next = getAdjacentSegment(
                MODE,
                caret(),
                event.shiftKey ? -1 : 1,
            );

            if (next) {
                event.preventDefault();
                selectSegment(next);
            }

            break;
        }

        case 'ArrowRight':
        case 'ArrowLeft': {
            const next = getAdjacentSegment(
                MODE,
                caret(),
                event.key === 'ArrowRight' ? 1 : -1,
            );

            event.preventDefault();
            selectSegment(next ?? active);
            break;
        }

        case 'ArrowUp':
            event.preventDefault();
            step(active, 1);
            break;

        case 'ArrowDown':
            event.preventDefault();
            step(active, -1);
            break;

        default:
            break;
    }
});

input.addEventListener('input', () => {
    if (programmaticValueChange) {
        return;
    }

    const active = getActiveSegment(MODE, caret());

    if (active) {
        announce(active);
    }
});
