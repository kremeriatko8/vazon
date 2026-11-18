# Care schedule rules

> **Values are placeholders until reviewed against a reliable horticultural source.**
> Every row below has the status **to verify**, except the soil-wet rule (decided by the author, pending team confirmation) and the season source (not decided). None of the "to verify" numbers has been checked yet. When you verify a value, replace the source with the reference you used (title, author or organisation, and a link), change the status to `verified`, and update `backend/src/care-schedules/schedule-rules.ts` in the same pull request.

The code lives in `backend/src/care-schedules/`:

- `schedule-rules.ts`: the constants below.
- `schedule.engine.ts`: the pure function `computeNextDue(input, now)`. It uses no database and does not read the clock.

## How the interval is computed

1. **Base interval** = `BASE_INTERVAL_DAYS[task] × WATER_NEED_FACTOR[task][need] × LIGHT_FACTOR[task][light] × POT_SIZE_FACTOR[task][pot]`, rounded to whole days (at least `MIN_INTERVAL_DAYS`).
2. **Adjusted interval** = base × `RADIATOR_FACTOR[distance]` (WATER only) × `SEASON_FACTOR[season]` (WATER and FEED only), rounded to whole days (at least `MIN_INTERVAL_DAYS`).
3. **Soil still wet** (WATER only): add `min(soilWetCount × SOIL_WET_POSTPONE_DAYS, SOIL_WET_MAX_CYCLE_DAYS)` days to the adjusted interval. `soilWetCount` is the number of "soil still wet" responses in the current cycle; a negative or non-integer count throws an error. FEED and REPOT ignore it.
4. **Due date** = 00:00 UTC of the day of `lastDoneDate` + interval days. If that is earlier than 00:00 UTC of `now`'s day, the due date is today (00:00 UTC).

A factor below 1 shortens the interval; a factor above 1 lengthens it. All dates are in UTC. The frontend displays them in `Europe/Kyiv`.

## Constants

| Name | Value | Unit | Source | Status |
| --- | --- | --- | --- | --- |
| `BASE_INTERVAL_DAYS.WATER` | 7 | days | TO VERIFY: typical watering interval for a common houseplant in medium light and a medium pot | to verify |
| `BASE_INTERVAL_DAYS.FEED` | 30 | days | TO VERIFY: typical fertilising interval during the growing season | to verify |
| `BASE_INTERVAL_DAYS.REPOT` | 365 | days | TO VERIFY: typical repotting interval for a common houseplant | to verify |
| `LIGHT_FACTOR.WATER.LOW` | 1.5 | multiplier | TO VERIFY: how much less often to water in low light | to verify |
| `LIGHT_FACTOR.WATER.MEDIUM` | 1 | multiplier | TO VERIFY: confirm medium light as the reference condition | to verify |
| `LIGHT_FACTOR.WATER.BRIGHT_INDIRECT` | 0.85 | multiplier | TO VERIFY: how much more often to water in bright indirect light | to verify |
| `LIGHT_FACTOR.WATER.DIRECT` | 0.7 | multiplier | TO VERIFY: how much more often to water in direct sun | to verify |
| `LIGHT_FACTOR.FEED.LOW` | 1 | multiplier | TO VERIFY: whether low light should change the feeding interval | to verify |
| `LIGHT_FACTOR.FEED.MEDIUM` | 1 | multiplier | TO VERIFY: confirm medium light as the reference condition | to verify |
| `LIGHT_FACTOR.FEED.BRIGHT_INDIRECT` | 1 | multiplier | TO VERIFY: whether bright indirect light should change the feeding interval | to verify |
| `LIGHT_FACTOR.FEED.DIRECT` | 1 | multiplier | TO VERIFY: whether direct sun should change the feeding interval | to verify |
| `LIGHT_FACTOR.REPOT.LOW` | 1 | multiplier | TO VERIFY: whether low light should change the repotting interval | to verify |
| `LIGHT_FACTOR.REPOT.MEDIUM` | 1 | multiplier | TO VERIFY: confirm medium light as the reference condition | to verify |
| `LIGHT_FACTOR.REPOT.BRIGHT_INDIRECT` | 1 | multiplier | TO VERIFY: whether bright indirect light should change the repotting interval | to verify |
| `LIGHT_FACTOR.REPOT.DIRECT` | 1 | multiplier | TO VERIFY: whether direct sun should change the repotting interval | to verify |
| `POT_SIZE_FACTOR.WATER.SMALL` | 0.75 | multiplier | TO VERIFY: how much more often a small pot needs water | to verify |
| `POT_SIZE_FACTOR.WATER.MEDIUM` | 1 | multiplier | TO VERIFY: confirm a medium pot as the reference size | to verify |
| `POT_SIZE_FACTOR.WATER.LARGE` | 1.25 | multiplier | TO VERIFY: how much less often a large pot needs water | to verify |
| `POT_SIZE_FACTOR.FEED.SMALL` | 1 | multiplier | TO VERIFY: whether pot size should change the feeding interval | to verify |
| `POT_SIZE_FACTOR.FEED.MEDIUM` | 1 | multiplier | TO VERIFY: confirm a medium pot as the reference size | to verify |
| `POT_SIZE_FACTOR.FEED.LARGE` | 1 | multiplier | TO VERIFY: whether pot size should change the feeding interval | to verify |
| `POT_SIZE_FACTOR.REPOT.SMALL` | 1 | multiplier | TO VERIFY: whether plants in small pots need repotting sooner | to verify |
| `POT_SIZE_FACTOR.REPOT.MEDIUM` | 1 | multiplier | TO VERIFY: confirm a medium pot as the reference size | to verify |
| `POT_SIZE_FACTOR.REPOT.LARGE` | 1 | multiplier | TO VERIFY: whether plants in large pots can wait longer to be repotted | to verify |
| `RADIATOR_FACTOR.NEAR` | 0.8 | multiplier (WATER only) | TO VERIFY: how much faster soil dries under 1 m from a radiator | to verify |
| `RADIATOR_FACTOR.MEDIUM` | 1 | multiplier (WATER only) | TO VERIFY: whether 1–2 m from a radiator should shorten the interval | to verify |
| `RADIATOR_FACTOR.FAR` | 1 | multiplier (WATER only) | TO VERIFY: confirm more than 2 m from a radiator has no effect | to verify |
| `RADIATOR_FACTOR.NONE` | 1 | multiplier (WATER only) | TO VERIFY: confirm no radiator as the reference condition | to verify |
| `RADIATOR_ADJUSTED_TASKS` | WATER | task types | TO VERIFY: whether radiator heat should also affect feeding | to verify |
| `SEASON_FACTOR.WINTER` | 1.5 | multiplier | TO VERIFY: how much to reduce watering and feeding in winter | to verify |
| `SEASON_FACTOR.SPRING` | 1 | multiplier | TO VERIFY: confirm spring as a reference season | to verify |
| `SEASON_FACTOR.SUMMER` | 1 | multiplier | TO VERIFY: whether summer should shorten the interval | to verify |
| `SEASON_FACTOR.AUTUMN` | 1 | multiplier | TO VERIFY: whether autumn should lengthen the interval | to verify |
| `SEASON_ADJUSTED_TASKS` | WATER, FEED | task types | TO VERIFY: whether season should also affect repotting | to verify |
| `SOIL_WET_POSTPONE_DAYS`, `SOIL_WET_MAX_CYCLE_DAYS` | 1, 2 | days | Soil still wet: +1 day per response to WATER, max +2 days per cycle. | DECIDED by author, pending team confirmation |
| Season source | — | — | Meteorological season by calendar month in Europe/Kyiv: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn (`seasonFor`) | DECIDED by author, pending team confirmation |
| `MIN_INTERVAL_DAYS` | 1 | days | TO VERIFY: confirm the shortest sensible interval | to verify |

## Open questions

- How the season is chosen (for example, from the month in `Europe/Kyiv`) is not decided yet. The caller passes the season to the engine.
- Species-specific rules are not modelled. Every plant uses the same base intervals.
| `WATER_NEED_FACTOR.WATER.LOW` | 2.5 | multiplier | TO VERIFY: how much less often to water cacti and succulents | to verify |
| `WATER_NEED_FACTOR.WATER.MEDIUM` | 1 | multiplier | TO VERIFY: confirm a typical houseplant as the reference | to verify |
| `WATER_NEED_FACTOR.WATER.HIGH` | 0.7 | multiplier | TO VERIFY: how much more often to water ferns and calatheas | to verify |
| `WATER_NEED_FACTOR.FEED.*`, `WATER_NEED_FACTOR.REPOT.*` | 1 | multiplier | TO VERIFY: whether water need should change feeding or repotting | to verify |
| `WATER_AMOUNT_ML.SMALL` | 100–200 | ml per watering | TO VERIFY: water for a pot up to about 12 cm | to verify |
| `WATER_AMOUNT_ML.MEDIUM` | 300–500 | ml per watering | TO VERIFY: water for a pot of about 13–20 cm | to verify |
| `WATER_AMOUNT_ML.LARGE` | 700–1000 | ml per watering | TO VERIFY: water for a pot over 20 cm | to verify |
| `WATER_AMOUNT_FACTOR.LOW` | 0.5 | multiplier | TO VERIFY: how much less water cacti and succulents get per watering | to verify |
| `WATER_AMOUNT_FACTOR.MEDIUM`, `.HIGH` | 1 | multiplier | TO VERIFY: whether moisture lovers need more per watering or only more often | to verify |
| `TOO_EARLY_SHARE` | 0.5 | share of the interval | Logging WATERED or FED again before half of the interval (at least 1 day) needs `confirm: true` | DECIDED by author, pending team confirmation |
| `FEED_MONTHS` | 3–9 (March to September) | months, Europe/Kyiv | A FEED task due outside these months moves to 1 March (rest period, `restPeriod: true`) | to verify |
| `UNDO_WINDOW_HOURS` | 24 | hours | How long after logging a care entry the owner can undo it | DECIDED by author, pending team confirmation |
| SOIL_WET per day | 1 | entries per plant per day | A second soil check on the same day is rejected | DECIDED by author, pending team confirmation |

## Species water need

`species.water_need` (`LOW`, `MEDIUM`, `HIGH`) is set by the migration `20261119000000_species_water_need`. LOW: cacti, succulents, sansevierias, ZZ plant, yucca and similar. HIGH: ferns, calatheas, marantas, stromanthe, peace lily. Everything else is MEDIUM, and a plant without a catalog species counts as MEDIUM. **Data status: TO VERIFY.**
