-- =============================================
-- Stored Procedure: vendors.sp_GetStatus
-- Description: Gets vendor registration status for a user
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetStatus]'))
    DROP PROCEDURE [vendors].[sp_GetStatus];
GO

CREATE PROCEDURE [vendors].[sp_GetStatus]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.IsVerified,
        CASE 
            WHEN vp.BusinessName IS NULL THEN 0
            WHEN vp.BusinessDescription IS NULL THEN 0
            WHEN vp.BusinessPhone IS NULL THEN 0
            WHEN vp.Address IS NULL THEN 0
            ELSE 1
        END AS IsProfileComplete
    FROM vendors.VendorProfiles vp
    WHERE vp.UserID = @UserID;
END
GO

