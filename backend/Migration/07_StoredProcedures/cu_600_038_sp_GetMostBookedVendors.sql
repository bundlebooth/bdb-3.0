/*
    Migration Script: Create Stored Procedure [vendors.sp_GetMostBooked]
    Phase: 600 - Stored Procedures
    Script: cu_600_038_sp_GetMostBookedVendors.sql
    Description: Creates the [vendors].[sp_GetMostBooked] stored procedure
    Schema: vendors
    Execution Order: 38
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetMostBooked]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetMostBooked]'))
    DROP PROCEDURE [vendors].[sp_GetMostBooked];
GO

CREATE PROCEDURE [vendors].[sp_GetMostBooked]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM vendors.VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND TotalBookings > 0
    ORDER BY TotalBookings DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetMostBooked] created successfully.';
GO

