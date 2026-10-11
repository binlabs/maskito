import {strict as assert} from 'node:assert';
import {test} from 'node:test';

import {
    getActiveSegment,
    getAdjacentSegment,
    getSegments,
} from './segment-model.js';

test('getSegments: dd/mm/yyyy', () => {
    assert.deepEqual(getSegments('dd/mm/yyyy'), [
        {name: 'day', from: 0, to: 2},
        {name: 'month', from: 3, to: 5},
        {name: 'year', from: 6, to: 10},
    ]);
});

test('getSegments: mm/dd/yyyy (US order)', () => {
    assert.deepEqual(getSegments('mm/dd/yyyy'), [
        {name: 'month', from: 0, to: 2},
        {name: 'day', from: 3, to: 5},
        {name: 'year', from: 6, to: 10},
    ]);
});

test('getSegments: yyyy-mm-dd (other separator/order)', () => {
    assert.deepEqual(getSegments('yyyy-mm-dd'), [
        {name: 'year', from: 0, to: 4},
        {name: 'month', from: 5, to: 7},
        {name: 'day', from: 8, to: 10},
    ]);
});

test('getActiveSegment: caret inside each segment', () => {
    const mode = 'dd/mm/yyyy';

    assert.equal(getActiveSegment(mode, 1)?.name, 'day');
    assert.equal(getActiveSegment(mode, 4)?.name, 'month');
    assert.equal(getActiveSegment(mode, 8)?.name, 'year');
});

test('getActiveSegment: caret at string start and end', () => {
    const mode = 'dd/mm/yyyy';

    assert.equal(getActiveSegment(mode, 0)?.name, 'day');
    assert.equal(getActiveSegment(mode, 10)?.name, 'year');
});

test('getActiveSegment: caret on a separator resolves to the preceding segment', () => {
    const mode = 'dd/mm/yyyy';

    // caret index 2 = just after "dd", before the "/"
    assert.equal(getActiveSegment(mode, 2)?.name, 'day');
    // caret index 5 = just after "mm", before the "/"
    assert.equal(getActiveSegment(mode, 5)?.name, 'month');
});

test('getActiveSegment: caret just after a separator resolves to the following segment', () => {
    const mode = 'dd/mm/yyyy';

    assert.equal(getActiveSegment(mode, 3)?.name, 'month');
    assert.equal(getActiveSegment(mode, 6)?.name, 'year');
});

test('getAdjacentSegment: forward (Tab) walks day -> month -> year then stops', () => {
    const mode = 'dd/mm/yyyy';

    assert.equal(getAdjacentSegment(mode, 1, 1)?.name, 'month');
    assert.equal(getAdjacentSegment(mode, 4, 1)?.name, 'year');
    assert.equal(getAdjacentSegment(mode, 8, 1), null);
});

test('getAdjacentSegment: backward (Shift+Tab) walks year -> month -> day then stops', () => {
    const mode = 'dd/mm/yyyy';

    assert.equal(getAdjacentSegment(mode, 8, -1)?.name, 'month');
    assert.equal(getAdjacentSegment(mode, 4, -1)?.name, 'day');
    assert.equal(getAdjacentSegment(mode, 1, -1), null);
});
