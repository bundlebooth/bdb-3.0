-- Database: EventBookingPlatform
-- Description: Comprehensive schema for multi-service event booking platform
-- Version: 1.0
-- Author: [Your Name]
-- Created: [Current Date]

USE master;
GO

-- Create the database with recommended settings
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'EventBookingPlatform')
BEGIN
    CREATE DATABASE EventBookingPlatform
    COLLATE SQL_Latin1_General_CP1_CI_AS;
GO
    ALTER DATABASE EventBookingPlatform SET RECOVERY FULL;
GO
    ALTER DATABASE EventBookingPlatform SET AUTO_CLOSE OFF;
GO
    ALTER DATABASE EventBookingPlatform SET AUTO_SHRINK OFF;
GO
    ALTER DATABASE EventBookingPlatform SET ALLOW_SNAPSHOT_ISOLATION ON;
GO
    ALTER DATABASE EventBookingPlatform SET READ_COMMITTED_SNAPSHOT ON;
GO
END
GO

USE EventBookingPlatform;
GO

