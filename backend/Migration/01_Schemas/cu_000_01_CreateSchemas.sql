/*
    Migration Script: Create Schemas
    Phase: 000 - Schemas
    Script: cu_000_01_CreateSchemas.sql
    Description: Creates all required schemas for the VV_DB database
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating schemas...';
GO

-- Create dbo schema (exists by default, but included for completeness)
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA [dbo]');
    PRINT 'Schema [dbo] created.';
END
ELSE
BEGIN
    PRINT 'Schema [dbo] already exists. Skipping.';
END
GO

-- Create staging schema for ETL/data migration operations
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'staging')
BEGIN
    EXEC('CREATE SCHEMA [staging]');
    PRINT 'Schema [staging] created.';
END
ELSE
BEGIN
    PRINT 'Schema [staging] already exists. Skipping.';
END
GO

-- Create audit schema for audit/logging tables
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'audit')
BEGIN
    EXEC('CREATE SCHEMA [audit]');
    PRINT 'Schema [audit] created.';
END
ELSE
BEGIN
    PRINT 'Schema [audit] already exists. Skipping.';
END
GO

-- Create archive schema for archived data
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'archive')
BEGIN
    EXEC('CREATE SCHEMA [archive]');
    PRINT 'Schema [archive] created.';
END
ELSE
BEGIN
    PRINT 'Schema [archive] already exists. Skipping.';
END
GO

-- Create admin schema for admin-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'admin')
BEGIN
    EXEC('CREATE SCHEMA [admin]');
    PRINT 'Schema [admin] created.';
END
ELSE
BEGIN
    PRINT 'Schema [admin] already exists. Skipping.';
END
GO

-- Create analytics schema for analytics-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'analytics')
BEGIN
    EXEC('CREATE SCHEMA [analytics]');
    PRINT 'Schema [analytics] created.';
END
ELSE
BEGIN
    PRINT 'Schema [analytics] already exists. Skipping.';
END
GO

-- Create bookings schema for booking-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'bookings')
BEGIN
    EXEC('CREATE SCHEMA [bookings]');
    PRINT 'Schema [bookings] created.';
END
ELSE
BEGIN
    PRINT 'Schema [bookings] already exists. Skipping.';
END
GO

-- Create favorites schema for favorites-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'favorites')
BEGIN
    EXEC('CREATE SCHEMA [favorites]');
    PRINT 'Schema [favorites] created.';
END
ELSE
BEGIN
    PRINT 'Schema [favorites] already exists. Skipping.';
END
GO

-- Create invoices schema for invoice-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'invoices')
BEGIN
    EXEC('CREATE SCHEMA [invoices]');
    PRINT 'Schema [invoices] created.';
END
ELSE
BEGIN
    PRINT 'Schema [invoices] already exists. Skipping.';
END
GO

-- Create messages schema for messaging-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'messages')
BEGIN
    EXEC('CREATE SCHEMA [messages]');
    PRINT 'Schema [messages] created.';
END
ELSE
BEGIN
    PRINT 'Schema [messages] already exists. Skipping.';
END
GO

-- Create notifications schema for notification-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'notifications')
BEGIN
    EXEC('CREATE SCHEMA [notifications]');
    PRINT 'Schema [notifications] created.';
END
ELSE
BEGIN
    PRINT 'Schema [notifications] already exists. Skipping.';
END
GO

-- Create payments schema for payment-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'payments')
BEGIN
    EXEC('CREATE SCHEMA [payments]');
    PRINT 'Schema [payments] created.';
END
ELSE
BEGIN
    PRINT 'Schema [payments] already exists. Skipping.';
END
GO

-- Create reviews schema for review-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'reviews')
BEGIN
    EXEC('CREATE SCHEMA [reviews]');
    PRINT 'Schema [reviews] created.';
END
ELSE
BEGIN
    PRINT 'Schema [reviews] already exists. Skipping.';
END
GO

-- Create users schema for user-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'users')
BEGIN
    EXEC('CREATE SCHEMA [users]');
    PRINT 'Schema [users] created.';
END
ELSE
BEGIN
    PRINT 'Schema [users] already exists. Skipping.';
END
GO

-- Create vendors schema for vendor-related objects
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'vendors')
BEGIN
    EXEC('CREATE SCHEMA [vendors]');
    PRINT 'Schema [vendors] created.';
END
ELSE
BEGIN
    PRINT 'Schema [vendors] already exists. Skipping.';
END
GO

-- Create core schema for shared/common objects (categories, services, etc.)
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'core')
BEGIN
    EXEC('CREATE SCHEMA [core]');
    PRINT 'Schema [core] created.';
END
ELSE
BEGIN
    PRINT 'Schema [core] already exists. Skipping.';
END
GO

PRINT 'Schema creation completed.';
GO
