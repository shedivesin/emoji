# Geomancy Emoji
This repository contains images of the sixteen geomantic figures, in both PNG
and SVG format. In both cases, the images are of a white [squircle][1] (that
is, the superellipse such that `x^4+y^4=r^4`) with the geomantic figure
superimposed over it in black (for latent lines) and crimson (for active
lines).

The PNG versions were the originals, since it's trivial to draw a squircle
pixel-by-pixel. To draw the SVGs, one has to approximate the squircle using
cubic Bezier splines; I did this using a generalization of [this technique][2]
(using eight arc segments, instead of four).

I optimized the SVGs as best I could by hand, and then I fed all the images
through [svgo][3] and [ImageOptim][4] in order to ensure they consume as little
bandwidth as possible. You should favor the SVGs if at all possible, since they
are about an eighth of the size.

This entire repository is licensed under the [CC0-1.0 License][4]: you may do
whatever you wish with any of these files without restriction.

[1]: http://mathworld.wolfram.com/Squircle.html
[2]: http://spencermortensen.com/articles/bezier-circle/
[3]: https://github.com/svg/svgo
[4]: https://imageoptim.com
[5]: https://creativecommons.org/publicdomain/zero/1.0/
