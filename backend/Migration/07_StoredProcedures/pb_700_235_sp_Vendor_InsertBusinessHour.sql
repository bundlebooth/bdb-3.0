-- =============================================
-- Stored Procedure: vendors.sp_InsertBusinessHour
-- Description: Inserts a business hour for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertBusinessHour]'))
    DROP PROCEDURE [vendors].[sp_InsertBusinessHour];
GO

CREATE PROCEDURE [vendors].[sp_InsertBusinessHour]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100) = 'America/Toronto'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable, @Timezone);
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO

