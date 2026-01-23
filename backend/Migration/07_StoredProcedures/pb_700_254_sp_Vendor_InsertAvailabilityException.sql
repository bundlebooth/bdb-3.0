-- =============================================
-- Stored Procedure: vendors.sp_InsertAvailabilityException
-- Description: Inserts an availability exception for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertAvailabilityException]'))
    DROP PROCEDURE [vendors].[sp_InsertAvailabilityException];
GO

CREATE PROCEDURE [vendors].[sp_InsertAvailabilityException]
    @VendorProfileID INT,
    @Date DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @IsAvailable BIT,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorAvailabilityExceptions (VendorProfileID, Date, StartTime, EndTime, IsAvailable, Reason)
    VALUES (@VendorProfileID, @Date, @StartTime, @EndTime, @IsAvailable, @Reason);
    
    SELECT SCOPE_IDENTITY() AS ExceptionID;
END
GO

