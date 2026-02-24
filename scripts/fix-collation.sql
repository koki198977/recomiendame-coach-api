-- Fix collation version mismatch
ALTER DATABASE coach REFRESH COLLATION VERSION;

-- Verify the fix
SELECT datname, datcollate, datcollversion 
FROM pg_database 
WHERE datname = 'coach';