-- Custom SQL migration file, put your code below! --
SELECT create_hypertable('prices_history', by_range('time'));--> statement-breakpoint

CREATE INDEX ix_denom_time ON prices_history (denom, time DESC);--> statement-breakpoint

CREATE MATERIALIZED VIEW one_minute_candle
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    denom,
    FIRST(price, time) AS "open",
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, time) AS "close"
FROM prices_history
GROUP BY bucket, denom
WITH NO DATA;--> statement-breakpoint

CREATE MATERIALIZED VIEW one_hour_candle
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    denom,
    FIRST(price, time) AS "open",
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, time) AS "close"
FROM prices_history
GROUP BY bucket, denom
WITH NO DATA;--> statement-breakpoint

CREATE MATERIALIZED VIEW one_day_candle
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    denom,
    FIRST(price, time) AS "open",
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, time) AS "close"
FROM prices_history
GROUP BY bucket, denom
WITH NO DATA;--> statement-breakpoint

CREATE MATERIALIZED VIEW one_week_candle
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('7 days', time) AS bucket,
    denom,
    FIRST(price, time) AS "open",
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, time) AS "close"
FROM prices_history
GROUP BY bucket, denom
WITH NO DATA;--> statement-breakpoint

CREATE MATERIALIZED VIEW one_month_candle
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', time) AS bucket,
    denom,
    FIRST(price, time) AS "open",
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, time) AS "close"
FROM prices_history
GROUP BY bucket, denom
WITH NO DATA;--> statement-breakpoint

SELECT add_continuous_aggregate_policy('one_minute_candle',
    start_offset => INTERVAL '4 hours',
    end_offset => null,
    schedule_interval => INTERVAL '5 second');--> statement-breakpoint

SELECT add_continuous_aggregate_policy('one_hour_candle',
    start_offset => INTERVAL '1 days',
    end_offset => null,
    schedule_interval => INTERVAL '1 minute');--> statement-breakpoint

SELECT add_continuous_aggregate_policy('one_day_candle',
    start_offset => INTERVAL '1 days',
    end_offset => null,
    schedule_interval => INTERVAL '1 hour');--> statement-breakpoint

SELECT add_continuous_aggregate_policy('one_week_candle',
    start_offset => INTERVAL '30 days',
    end_offset => null,
    schedule_interval => INTERVAL '1 day');--> statement-breakpoint

SELECT add_continuous_aggregate_policy('one_month_candle',
    start_offset => INTERVAL '3 months',
    end_offset => null,
    schedule_interval => INTERVAL '1 week');--> statement-breakpoint

-- SELECT remove_continuous_aggregate_policy('one_minute_candle');
-- CALL refresh_continuous_aggregate('one_minute_candle', now() - INTERVAL '24 hours', null);
-- DROP MATERIALIZED VIEW one_minute_candle;

CREATE VIEW prices AS
WITH latest_prices AS (
    SELECT
        denom,
        LAST(price, time) AS last_price
    FROM prices_history
    GROUP BY denom
),
five_minutes_candle_data AS (
    SELECT
        denom,
        time_bucket('5 minute', bucket) AS bucket,
        FIRST(open, bucket) AS open,
        LAST(close, bucket) AS close
    FROM one_minute_candle
    GROUP BY denom, time_bucket('5 minute', bucket)
    ORDER BY bucket DESC
),
one_hour_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS one_hour_pct_change
    FROM five_minutes_candle_data
    WHERE bucket >= NOW() - INTERVAL '1 hour'
    GROUP BY denom
),
one_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS one_day_pct_change
    FROM five_minutes_candle_data
    WHERE bucket >= NOW() - INTERVAL '1 day'
    GROUP BY denom
),
seven_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS seven_day_pct_change
    FROM five_minutes_candle_data
    WHERE bucket >= NOW() - INTERVAL '7 days'
    GROUP BY denom
),
thirty_day_change AS (
    SELECT
        denom,
        (LAST(close, bucket) - FIRST(open, bucket)) / FIRST(open, bucket) * 100 AS thirty_day_pct_change
    FROM five_minutes_candle_data
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
LEFT JOIN thirty_day_change tdc ON lp.denom = tdc.denom;--> statement-breakpoint