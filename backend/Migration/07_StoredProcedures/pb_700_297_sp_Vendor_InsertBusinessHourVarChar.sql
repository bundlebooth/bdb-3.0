-- =============================================
-- Stored Procedure: vendors.sp_InsertBusinessHourVarChar
-- Description: Inserts a business hour for a vendor using VarChar time
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertBusinessHourVarChar]'))
    DROP PROCEDURE [vendors].[sp_InsertBusinessHourVarChar];
GO

CREATE PROCEDURE [vendors].[sp_InsertBusinessHourVarChar]
    @VendorProfileID INT,
    @DayOfWeek INT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, 1, GETUTCDATE(), GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO

