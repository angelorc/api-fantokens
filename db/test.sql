WITH latest_prices AS (
    SELECT
        denom,
        LAST(price, time) AS last_price
    FROM prices_history
    GROUP BY denom
),
five_minute_candle_data AS (
    SELECT
        denom,
        time_bucket('5 minute', bucket) AS bucket,
        FIRST(open, bucket) AS open,
        LAST(close, bucket) AS close
    FROM one_minute_candle
    GROUP BY denom, time_bucket('5 minute', bucket)
    order by bucket desc
),
one_hour_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS one_hour_pct_change
    FROM five_minute_candle_data
    WHERE bucket >= NOW() - INTERVAL '1 hour'
    GROUP BY denom
),
one_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS one_day_pct_change
    FROM five_minute_candle_data
    WHERE bucket >= NOW() - INTERVAL '1 day'
    GROUP BY denom
),
seven_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS seven_day_pct_change
    FROM five_minute_candle_data
    WHERE bucket >= NOW() - INTERVAL '7 days'
    GROUP BY denom
),
thirty_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS thirty_day_pct_change
    FROM five_minute_candle_data
    WHERE bucket >= NOW() - INTERVAL '30 days'
    GROUP BY denom
)
SELECT
    lp.denom,
    lp.last_price,
    COALESCE(ohc.one_hour_pct_change, 0) AS "1h_pct_change",
    COALESCE(odc.one_day_pct_change, 0) AS "1d_pct_change",
    COALESCE(sdc.seven_day_pct_change, 0) AS "7d_pct_change",
    COALESCE(tdc.thirty_day_pct_change, 0) AS "30d_pct_change"
FROM latest_prices lp
LEFT JOIN one_hour_change ohc ON lp.denom = ohc.denom
LEFT JOIN one_day_change odc ON lp.denom = odc.denom
LEFT JOIN seven_day_change sdc ON lp.denom = sdc.denom
LEFT JOIN thirty_day_change tdc ON lp.denom = tdc.denom;