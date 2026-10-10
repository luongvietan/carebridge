# Responsive fixes from rendered mobile checks

Root browser check on Portuguese homepage at 320 x 800 found document width 340px, caused by the non-wrapping About intro rating/avatar row. The row now wraps with independent vertical spacing, keeps avatars together, and lets the rating text shrink/wrap.

The compliance image status overlay exceeded its narrow image container. At mobile widths the card now uses left/right insets, a smaller inset image, and flexible text/chart content; desktop retains its existing inset-image sizing. This fixes the content sizing instead of masking page overflow.

Validation: targeted component ESLint and TypeScript checks. Root browser recheck owns final rendered widths/screenshots.
