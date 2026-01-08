-- =============================================
-- Stored Procedure: vendors.sp_InsertBusinessHourSimple
-- Description: Inserts a business hour for a vendor (simple version)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertBusinessHourSimple]'))
    DROP PROCEDURE [vendors].[sp_InsertBusinessHourSimple];
GO

CREATE PROCEDURE [vendors].[sp_InsertBusinessHourSimple]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime TIME = NULL,
    @CloseTime TIME = NULL,
    @IsAvailable BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable);
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO

