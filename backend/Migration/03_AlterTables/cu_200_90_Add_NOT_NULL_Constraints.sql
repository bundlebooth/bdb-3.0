/*
    Migration Script: Add NOT NULL Constraints to Critical Columns
    Description: Ensures required columns cannot be NULL for data integrity
    
    Execution Order: 90
*/

SET NOCOUNT ON;
GO

PRINT 'Adding NOT NULL constraints to critical columns...';
GO

-- =============================================
-- Fix any existing NULL values first
-- =============================================

-- bookings.Bookings
UPDATE bookings.Bookings SET VendorProfileID = 1 WHERE VendorProfileID IS NULL;
UPDATE bookings.Bookings SET Status = 'pending' WHERE Status IS NULL;
UPDATE bookings.Bookings SET CreatedAt = GETDATE() WHERE CreatedAt IS NULL;
GO

-- users.Users
UPDATE users.Users SET CreatedAt = GETDATE() WHERE CreatedAt IS NULL;
GO

-- invoices.Invoices
UPDATE invoices.Invoices SET Status = 'pending' WHERE Status IS NULL;
UPDATE invoices.Invoices SET CreatedAt = GETDATE() WHERE CreatedAt IS NULL;
GO

-- =============================================
-- Add NOT NULL constraints
-- Note: Some columns may have indexes that prevent direct ALTER
-- In production, indexes should be dropped and recreated
-- =============================================

-- bookings.Bookings - Status and CreatedAt
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'bookings' AND TABLE_NAME = 'Bookings' 
           AND COLUMN_NAME = 'Status' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE bookings.Bookings ALTER COLUMN Status NVARCHAR(50) NOT NULL;
    PRINT 'Added NOT NULL to bookings.Bookings.Status';
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'bookings' AND TABLE_NAME = 'Bookings' 
           AND COLUMN_NAME = 'CreatedAt' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE bookings.Bookings ALTER COLUMN CreatedAt DATETIME NOT NULL;
    PRINT 'Added NOT NULL to bookings.Bookings.CreatedAt';
END
GO

-- users.Users - Email and CreatedAt
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'users' AND TABLE_NAME = 'Users' 
           AND COLUMN_NAME = 'Email' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE users.Users ALTER COLUMN Email NVARCHAR(100) NOT NULL;
    PRINT 'Added NOT NULL to users.Users.Email';
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'users' AND TABLE_NAME = 'Users' 
           AND COLUMN_NAME = 'CreatedAt' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE users.Users ALTER COLUMN CreatedAt DATETIME NOT NULL;
    PRINT 'Added NOT NULL to users.Users.CreatedAt';
END
GO

-- invoices.Invoices - Status and CreatedAt
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'invoices' AND TABLE_NAME = 'Invoices' 
           AND COLUMN_NAME = 'Status' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE invoices.Invoices ALTER COLUMN Status NVARCHAR(50) NOT NULL;
    PRINT 'Added NOT NULL to invoices.Invoices.Status';
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = 'invoices' AND TABLE_NAME = 'Invoices' 
           AND COLUMN_NAME = 'CreatedAt' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE invoices.Invoices ALTER COLUMN CreatedAt DATETIME NOT NULL;
    PRINT 'Added NOT NULL to invoices.Invoices.CreatedAt';
END
GO

PRINT 'NOT NULL constraints added successfully.';
GO
