# Electricity Data

A web application presenting Finnish hourly electricity production, consumption and
price data, provided as a fixed historical dataset, as per-day statistics and
per-day detail.

## Language

**Data Point**:
One hour of measured production, consumption and price, identified by its starting
hour in Finnish local time. The atomic unit of the dataset; never modified.
_Avoid_: row, record, sample, reading

**Daily Statistics**:
The set of figures derived from all Data Points sharing one Finnish calendar day:
total production, total consumption, average price, and the day's longest Negative
Price Streak.
_Avoid_: daily summary, aggregate, day stats

**Day Detail**:
What a single Day is presented as in its own right, rather than as one row of Daily
Statistics. Reached from that Day's row in the list.
_Avoid_: day view, day page, drilldown, detail view

**Day**:
A Finnish calendar day, as given by the dataset's own `date` value. Days are not
uniformly 24 hours long: clock changes make some days 23 hours.
_Avoid_: date range, 24-hour period, UTC day

**Negative Price Streak**:
A run of consecutive hours within a single Day whose price is below zero. Streaks do
not continue across midnight — a Day's longest streak is measured within that Day
only.
_Avoid_: negative period, cheap streak, negative window

**Peak Consumption Ratio Hours**:
The Data Points within a Day whose consumption is the largest fraction of that same
hour's production. Consumption has never exceeded production anywhere in this dataset,
so these name the hours the production surplus was thinnest, not hours of shortfall.
Plural for the same reason Cheapest Hours is: hours measuring identically are
equally the peak, and a tie is never broken arbitrarily. A Day whose Data Points carry
no consumption has none.
_Avoid_: peak hour, peak demand, busiest hour, deficit hour

**Cheapest Hours**:
The three Data Points of a Day with the lowest price, cheapest first, and every further
Data Point priced the same as the third. A tie is never broken arbitrarily: hours the
dataset prices identically are equally cheap, so a Day whose every hour costs the same
has no cheapest three but twenty-four. A Day holding fewer than three priced Data Points
has correspondingly fewer, and one holding none has none.
_Avoid_: cheap hours, best hours, off-peak, low-price window

**Incomplete Day**:
A Day for which the dataset holds fewer Data Points than the day has hours, or whose
Data Points lack a measurement. Its totals are not comparable to a complete Day's, so
the number of hours actually present is reported alongside them.
_Avoid_: partial day, missing data, gap

**Production Discontinuity**:
The unexplained step in reported production values partway through 2023-06-13, after
which the series continues about five times higher. A property of the given data,
presented as received rather than corrected.
_Avoid_: outlier, bad data, anomaly, error
