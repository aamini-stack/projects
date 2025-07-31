import { parseMessage } from './messages';
import { describe, expect, test } from 'vitest';

describe('parseMessage', () => {
  test('Emote only', () => {
    const emotes = parseMessage('Kappa');
    expect(emotes).toHaveLength(1);
    expect(emotes[0]).toMatchObject({ kind: 'emote' });
  });

  test('Emote with spaces', () => {
    const emotes = parseMessage('Kappa  ');
    expect(emotes).toHaveLength(2);
    expect(emotes[0]).toMatchObject({ kind: 'emote' });
    expect(emotes[1]).toEqual({ kind: 'text', message: '  ' });
  });

  test('Incorrect emote', () => {
    const emotes = parseMessage(' KappaT');
    expect(emotes).toHaveLength(1);
    expect(emotes[0]).toEqual({ kind: 'text', message: ' KappaT' });
  });

  test('Three emotes', () => {
    const emotes = parseMessage('Kappa Kappa Kappa');
    expect(emotes).toHaveLength(5);
    expect(emotes[0]).toMatchObject({ kind: 'emote' });
    expect(emotes[1]).toEqual({ kind: 'text', message: ' ' });
    expect(emotes[2]).toMatchObject({ kind: 'emote' });
    expect(emotes[3]).toEqual({ kind: 'text', message: ' ' });
    expect(emotes[4]).toMatchObject({ kind: 'emote' });
  });
});
