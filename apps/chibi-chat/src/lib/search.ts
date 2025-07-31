export function binarySearch<E, K>(
  ar: E[],
  el: K,
  cmp: (x: E, y: K) => number,
) {
  let l = 0;
  let r = ar.length;

  while (l < r) {
    const m = Math.floor((l + r) / 2);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (cmp(ar[m]!, el) < 0) {
      l = m + 1;
    } else {
      r = m;
    }
  }

  return l;
}
