/*
    Migration Script: Create Stored Procedure [sp_GetMostBookedVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_038_dbo.sp_GetMostBookedVendors.sql
    Description: Creates the [dbo].[sp_GetMostBookedVendors] stored procedure
    
    Execution Order: 38
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetMostBookedVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMostBookedVendors]'))
    DROP PROCEDURE [dbo].[sp_GetMostBookedVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetMostBookedVendors]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND TotalBookings > 0
    ORDER BY TotalBookings DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetMostBookedVendors] created successfully.';
GO
