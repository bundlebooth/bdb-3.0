/*
    Migration Script: Stored Procedure - [email].[sp_GetVendorForApproval]
    Phase: 600 - Stored Procedures
    Script: cu_600_717_sp_Email_GetVendorForApproval.sql
    Description: Gets vendor details for approval/rejection email notifications
    
    Execution Order: 717
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('email.sp_GetVendorForApproval', 'P') IS NOT NULL
    DROP PROCEDURE email.sp_GetVendorForApproval;
GO

CREATE PROCEDURE email.sp_GetVendorForApproval
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        u.UserID,
        u.Email,
        u.Name
    FROM [vendors].[VendorProfiles] vp
    INNER JOIN [users].[Users] u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO

PRINT 'Created stored procedure: email.sp_GetVendorForApproval';
GO
