SELECT create_hypertable('prices_history', by_range('time'));

CREATE INDEX ix_symbol_time ON prices_history (denom, time DESC);

CREATE MATERIALIZED VIEW "1m_candle"
WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('1 minute', time) AS bucket,
        denom,
        FIRST(price, time) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, time) AS "close"
    FROM prices_history
    GROUP BY bucket, denom;

SELECT add_continuous_aggregate_policy('1m_candle',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

CREATE MATERIALIZED VIEW "15m_candle"
WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('15 minutes', time) AS bucket,
        denom,
        FIRST(price, time) AS "open",
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, time) AS "close"
    FROM prices_history
    GROUP BY bucket, denom;

SELECT add_continuous_aggregate_policy('15m_candle',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes');

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
    GROUP BY bucket, denom;

SELECT add_continuous_aggregate_policy('one_hour_candle',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

CALL refresh_continuous_aggregate('one_hour_candle', now() - INTERVAL '24 hours', now());

SELECT * FROM "1m_candle"
WHERE denom = 'BTC' AND bucket >= NOW() - INTERVAL '4 hours'
ORDER BY bucket;

SELECT
  time_bucket_gapfill ('5 minute', time) AS date,
  denom,
  locf (LAST (price, time)) AS "price"
FROM
  prices_history
WHERE
  time > '2021-12-31 00:00:00+00'::timestamptz
  AND time < '2025-02-22 10:00:00-00'::timestamptz
  AND denom = 'LTC'
GROUP BY
  date,
  denom
ORDER BY
  date DESC
LIMIT
  100;