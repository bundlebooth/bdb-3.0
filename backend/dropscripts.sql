
-- Drop all foreign key constraints
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'ALTER TABLE [' + s.name + '].[' + t.name + '] DROP CONSTRAINT [' + fk.name + '];' + CHAR(13)
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id;

EXEC sp_executesql @sql;

-- Drop all tables
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'DROP TABLE [' + s.name + '].[' + t.name + '];' + CHAR(13)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id;

EXEC sp_executesql @sql;


-- Drop all views
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'DROP VIEW [' + s.name + '].[' + v.name + '];' + CHAR(13)
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id;

EXEC sp_executesql @sql;


-- Drop all stored procedures
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'DROP PROCEDURE [' + s.name + '].[' + p.name + '];' + CHAR(13)
FROM sys.procedures p
JOIN sys.schemas s ON p.schema_id = s.schema_id;

EXEC sp_executesql @sql;

-- Drop all functions
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'DROP FUNCTION [' + s.name + '].[' + o.name + '];' + CHAR(13)
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.type IN ('FN', 'IF', 'TF');

EXEC sp_executesql @sql;


-- Drop user-defined types
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += 'DROP TYPE [' + s.name + '].[' + t.name + '];' + CHAR(13)
FROM sys.types t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.is_user_defined = 1;

EXEC sp_executesql @sql;


