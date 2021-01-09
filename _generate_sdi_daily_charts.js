"use strict";
const fs = require("fs");
const path = require("path");
const SVGO = require("svgo");
const svgo = new SVGO({multipass: true});

const K = 2.43; // 30 * Math.SQRT2 - 40
const POSITIONS = [
  [ 10-K,  50  ],
  [  0+K,  80  ],
  [ 20  , 100-K],
  [ 50  ,  90+K],
  [ 80  , 100-K],
  [100-K,  80  ],
  [ 90+K,  50  ],
  [100-K,  20  ],
  [ 80  ,   0+K],
  [ 50  ,  10-K],
  [ 20  ,   0+K],
  [  0+K,  20  ],
  [ 70-K,  30+K],
  [ 30+K,  30+K],
  [ 50  ,  70-K],
];


// bog-standard sideways add
function popcount(x) {
  x = (x & 0x55555555) + ((x >>  1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>  2) & 0x33333333);
  x = (x & 0x0F0F0F0F) + ((x >>  4) & 0x0F0F0F0F);
  x = (x & 0x00FF00FF) + ((x >>  8) & 0x00FF00FF);
  x = (x & 0x0000FFFF) + ((x >> 16) & 0x0000FFFF);

  return x;
}

// compute a geomantic chart from the four mothers
function chart(a, b, c, d) {
  // squish the mothers into one integer
  a = ((a <<  0) & 0x0000000F)|
      ((b <<  4) & 0x000000F0)|
      ((c <<  8) & 0x00000F00)|
      ((d << 12) & 0x0000F000);
  // add on the daughters, so a is now the first row of a shield chart
  a = ((a <<  0) & 0x0000FFFF)|
      ((a <<  7) & 0x00080000)|
      ((a << 10) & 0x00840000)|
      ((a << 13) & 0x08420000)|
      ((a << 16) & 0x84210000)|
      ((a << 19) & 0x42100000)|
      ((a << 22) & 0x21000000)|
      ((a << 25) & 0x10000000);
  // nieces
  b = (a & 0x0F0F0F0F) ^ ((a >>  4) & 0x0F0F0F0F);
  // witnesses
  c = (b & 0x000F000F) ^ ((b >>  8) & 0x000F000F);
  // judge
  d = (c & 0x0000000F) ^ ((c >> 16) & 0x0000000F);

  // put them all in an array
  // oh how I wish JS had 64-bit ints
  const houses = new Uint8Array(15);
  houses[ 0] = (a >>  0) & 0x0F;
  houses[ 1] = (a >>  4) & 0x0F;
  houses[ 2] = (a >>  8) & 0x0F;
  houses[ 3] = (a >> 12) & 0x0F;
  houses[ 4] = (a >> 16) & 0x0F;
  houses[ 5] = (a >> 20) & 0x0F;
  houses[ 6] = (a >> 24) & 0x0F;
  houses[ 7] = (a >> 28) & 0x0F;
  houses[ 8] = (b >>  0) & 0x0F;
  houses[ 9] = (b >>  8) & 0x0F;
  houses[10] = (b >> 16) & 0x0F;
  houses[11] = (b >> 24) & 0x0F;
  houses[12] = (c >>  0) & 0x0F;
  houses[13] = (c >> 16) & 0x0F;
  houses[14] = (d >>  0) & 0x0F;

  // all done
  return houses;
}

// this is merely a 16x16 bit table indicating which figures are in either
// demi-simple or compound company. (there is no need to do simple company, as
// that is handled by the partition() algorithm, below, and I don't track
// capitular company, as it appears to be too weak to matter much in practice.)
const COMPANY = new Uint32Array([
  0x45008000, 0x10000890, 0x64000044, 0x4b040210,
  0x01c00282, 0x20844022, 0x48200008, 0x000124a2,
]);
function has_company(a, b) {
  a = ((a << 0) & 0x0F) | ((b << 4) & 0xF0);
  return !!((COMPANY[a >> 5] >> (a & 31)) & 1);
}

// find the groups of houses that share figures either directly or by company
function partition(houses) {
  // define partitions for each unique figure
  const partitions = new Uint16Array(16);
  for(let i = 0; i < 15; i++) {
    partitions[houses[i]] |= 1 << i;
  }

  // merge partitions that are in company
  for(let i = 0; i < 14; i += 2) {
    const a = houses[i + 0];
    const b = houses[i + 1];
    if(has_company(a, b)) {
      const merge = partitions[a] | partitions[b];
      for(let j = 0; j < 15; j++) {
        if(partitions[j] & merge) {
          partitions[j] = merge;
        }
      }
    }
  }

  // generate the list of unique nontrivial partitions
  const unique = [];
  for(let i = 0; i < 16; i++) {
    const partition = partitions[i];
    if(popcount(partition) >= 2 && !unique.includes(partition)) {
      unique.push(partition);
    }
  }

  // all done
  return unique;
}

// find the permutation of a list of houses with the shortest path length
function distance(a, b) {
  const [ax, ay] = POSITIONS[a];
  const [bx, by] = POSITIONS[b];
  return Math.hypot(bx - ax, by - ay);
}
function shortest_path_rec(path, path_length, todo_bitset, best) {
  const n = path.length;

  if(todo_bitset === 0) {
    best.length = path_length;
    for(let i = 0; i < n; i++) {
      best.path[i] = path[i];
    }
    return;
  }

  for(let i = 0; i < 15; i++) {
    const mask = 1 << i;
    if(!(todo_bitset & mask)) {
      continue;
    }

    const new_path_length = path_length + (n && distance(path[n - 1], i));
    if(new_path_length >= best.length) {
      continue;
    }

    path.push(i);
    shortest_path_rec(path, new_path_length, todo_bitset ^ mask, best);
    path.pop();
  }
}
function shortest_path(bitset) {
  bitset &= 0x7FFF;

  const n = popcount(bitset);
  const path = new Array(n);
  shortest_path_rec([], 0, bitset, {length: Infinity, path});

  return path;
}

// draw the SVG chart for the given mothers
// FIXME: this is horrifically ugly, and needs some polish
function circle(i) {
  const [x, y] = POSITIONS[i];
  return `<circle cx="${x+10}" cy="${y+10}" r="10"/>`;
}
function line(i, j) {
  let [ax, ay] = POSITIONS[i];
  let [bx, by] = POSITIONS[j];
  let x = bx - ax;
  let y = by - ay;

  const k = 10 / Math.hypot(x, y);
  x *= k;
  y *= k;

  return `M${(ax+x+10).toFixed(2)} ${(ay+y+10).toFixed(2)} ${(bx-x+10).toFixed(2)} ${(by-y+10).toFixed(2)}`;
}
function stroke(i, j) {
  const [x, y] = POSITIONS[i];
  return `M${x+5} ${y+j*4+3}h11l-1 2h-11`;
}
function dot(i, j, n) {
  const [x, y] = POSITIONS[i];
  switch(n) {
    case 1: return `M${x+10} ${y+j*4+2}l2 2-2 2-2-2`;
    case 2: return `M${x+10} ${y+j*4+2}l2 2-4 4 2 2 2-2-4-4`;
    case 3: return `M${x+10} ${y+j*4+2}l2 2-4 4 4 4-2 2-2-2 4-4-4-4`;
    case 4: return `M${x+10} ${y+j*4+2}l2 2-4 4 4 4-4 4 2 2 2-2-4-4 4-4-4-4`;
  }
}
function svg(a, b, c, d) {
  const houses = chart(a, b, c, d);
  const paths = partition(houses).map(shortest_path);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.5 -1.5 123 123" width="246" height="246"><path d="M0 0H120V120H0" fill="#fff"/>`;

  if(paths.length !== 0) {
    svg += "<g fill=\"none\" stroke=\"#ccc\">";
    for(const path of paths) {
      for(const i of path) {
        svg += circle(i);
      }
    }
    svg += "<path d=\"";
    for(const path of paths) {
      const n = path.length;
      for(let i = 1; i < n; i++) {
        svg += line(path[i - 1], path[i]);
      }
    }
    svg += "\"/><path d=\"M0 60 60 0l60 60-60 60ZM0 0 30 30H90M120 0 90 30V90M120 120 90 90H30M0 120 30 90V30\" stroke=\"#000\"/></g>";
  }

  else {
    svg += "<path d=\"M0 60 60 0l60 60-60 60ZM0 0 30 30H90M120 0 90 30V90M120 120 90 90H30M0 120 30 90V30\" fill=\"none\" stroke=\"#000\"/>";
  }

  svg += "<path d=\"M-1.5-1.5h123v123h-123M0.5 0.5v119h119V0.5";
  for(let i = 0; i < 15; i++) {
    const figure = houses[i];
    for(let j = 0; j < 4; j++) {
      if(((figure >> j) & 1) === 0) {
        svg += stroke(i, j);
      }
    }
  }
  svg += "\"/>";

  if(houses[0] | houses[1] | houses[2] | houses[3]) {
    svg += "<path d=\"";
    for(let i = 0; i < 15; i++) {
      const figure = houses[i];
      const segments = [{bit: figure&1, j: 0, n: 1}];
      for(let j = 1; j < 4; j++) {
        const bit = (figure >> j) & 1;
        if(bit === segments[segments.length - 1].bit) {
          segments[segments.length - 1].n++;
        }
        else {
          segments.push({bit, j, n: 1});
        }
      }
      for(const {bit, j, n} of segments) {
        if(bit === 1) {
          svg += dot(i, j, n);
        }
      }
    }
    svg += "\" fill=\"#d22\"/>";
  }

  svg += "</svg>";

  return svg;
}

async function main() {
  for(let a = 0; a < 16; a++) {
    for(let b = 0; b < 16; b++) {
      const dirname = path.join("sdi", a.toString(16) + b.toString(16));
      await fs.promises.mkdir(dirname, {recursive: true});

      for(let c = 0; c < 16; c++) {
        for(let d = 0; d < 16; d++) {
          const pathname = path.join(dirname, c.toString(16) + d.toString(16) + ".svg");
          const {data} = await svgo.optimize(svg(a, b, c, d));
          await fs.promises.writeFile(pathname, data);
        }
      }
    }
  }
}

main();
