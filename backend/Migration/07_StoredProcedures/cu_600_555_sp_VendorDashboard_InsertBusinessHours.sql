-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertBusinessHours
-- Description: Inserts new business hours
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.HoursID
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable, @Timezone, GETUTCDATE(), GETUTCDATE());
END
GO

