SELECT create_hypertable('prices_history', by_range('time'));

CREATE INDEX ix_denom_time ON prices_history (denom, time DESC);