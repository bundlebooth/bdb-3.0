/*
    Migration Script: Create Stored Procedure [sp_GetVendorProfileDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_071_dbo.sp_GetVendorProfileDetails.sql
    Description: Creates the [vendors].[sp_GetProfileDetails] stored procedure
    
    Execution Order: 71
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetProfileDetails]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetProfileDetails]'))
    DROP PROCEDURE [vendors].[sp_GetProfileDetails];
GO

CREATE   PROCEDURE [vendors].[sp_GetProfileDetails]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorDetails
    WHERE VendorProfileID = @VendorProfileID;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetProfileDetails] created successfully.';
GO
