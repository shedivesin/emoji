# Geomancy Images
This repository contains:

1.  Emoji-like icons of the sixteen geomantic figures, in both PNG and SVG
    format, in three variants:

    *   `western`, following European Renaissance practice.
    *   `arabic`, following Arabic practice.
    *   `cgd`, following [Celtic Golden Dawn][6] practice. (These were made
        following a design by [@tumeric][7] at [@conjunctio][8].)

    Each of these are images of a white [squircle][1] (that is, the shape
    described by the equation `x^4+y^4=r^4`) with the appropriate geomantic
    figure superimposed over it.

    The PNG versions came first, since it's very easy to draw a squircle
    pixel-by-pixel. To draw the SVGs, one has to approximate the squircle
    using cubic Bezier splines; I did this using a generalization of [this
    technique][2] (using eight arc segments, instead of four).

2.  Images of every possible shield and house chart, using both stylistic
    variants of the geomantic figures. (There are 65,536 possible charts, times
    two for chart type and times two for style, making 262,144 images in all.)
    These are only available in SVG format for reasons of size.

3.  A generator script to make it easy to get the HTML code necessary to
    display a given chart.

The images are really quite tiny. I optimized the SVGs as best I could by
hand (by using various tricks, like combining paths together), and then I fed
all the SVGs through [svgo][3] and all the PNGs through [ImageOptim][4] in
order to ensure they consume as little bandwidth as possible. The SVGs should
be preferred over the PNGs if possible, since they are about an eighth of the
size.

This entire repository is licensed under the [CC0-1.0 License][4]: you may do
whatever you wish with any of these files without restriction.

[1]: http://mathworld.wolfram.com/Squircle.html
[2]: http://spencermortensen.com/articles/bezier-circle/
[3]: https://github.com/svg/svgo
[4]: https://imageoptim.com
[5]: https://creativecommons.org/publicdomain/zero/1.0/
[6]: http://www.druidical-gd.org
[7]: https://tumeric.dreamwidth.org
[8]: https://conjunctio.dreamwidth.org
