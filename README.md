# News Image — 21 November 2026

[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/herlienn/news-image-entry-21nov/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/herlienn/news-image-entry-21nov/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

One image that sums up the world's news of Saturday, 21 November 2026,
drawn as a one-page newspaper front page. The program draws every pixel
itself: a hand-made 5x7 bitmap font, drawn scenes and pictograms made from
plain shapes, and a hand-written PNG encoder. Standard library only, no
network, and every run writes byte-identical output.

Bounty: https://make.fun/bounty/news-image-20261121

## The model

This entry follows the pattern of the top-ranked entries of the 18, 19 and
20 November editions, which packed 35+ stories into one page: a count line
up front ("44 STORIES - 6 CONTINENTS - ONE DAY"), a per-region count bar,
a "Day in Numbers" strip, three large illustrated hero panels, a world map
with pins marking where each story happened, a numbered "Also on" list, a
"By the Clock — UTC" timeline, and a footer with sources and a date check.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, under 1 MiB).

## What the image covers

- **Lead — Russia's largest strike on Ukraine; a missile lands in Poland:**
  400+ drones and 110 missiles, Poland calls it a provocation.
- **AI rout sends the S&P 500 and Dow into correction** as AI stocks slide.
- **GTA VI takes a record $3.79 billion on day one:** 32.5 million
  pre-orders, the biggest entertainment launch ever.
- **Plus 41 more stories** across six continents: a magnitude 6.7 quake
  in the Peruvian Andes, Cyclone Xavier crossing the Cook Islands as a
  Category 5 storm, BepiColombo reaching Mercury after eight years,
  Voyager 1 now a full light-day from Earth, the COP31 talks running into
  overtime, and more — with a world map, a numbered list and a UTC timeline.
- **Date check:** most stories were first reported on Friday 20 November
  and headline the 21 November papers (news-cycle standard, stated in the
  image footer). Events dated 21 November UTC are marked in the timeline.
  Stories that could not be verified against two sources were left out.
