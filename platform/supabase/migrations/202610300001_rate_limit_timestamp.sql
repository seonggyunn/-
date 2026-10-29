-- Millisecond Unix timestamps exceed the PostgreSQL INTEGER range.
ALTER TABLE public.rate_limits ALTER COLUMN window_start TYPE BIGINT;
