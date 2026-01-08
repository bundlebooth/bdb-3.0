-- =============================================
-- Stored Procedure: admin.sp_GetDisputes
-- Description: Gets booking disputes with optional status filter
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetDisputes]'))
    DROP PROCEDURE [admin].[sp_GetDisputes];
GO

CREATE PROCEDURE [admin].[sp_GetDisputes]
    @Status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        u.Name as ClientName,
        u.Email as ClientEmail,
        vp.BusinessName as VendorName,
        b.TotalAmount as Amount,
        b.Status,
        b.CreatedAt,
        b.EventDate
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE (@Status IS NULL OR b.Status = @Status)
    ORDER BY b.CreatedAt DESC;
END
GO



