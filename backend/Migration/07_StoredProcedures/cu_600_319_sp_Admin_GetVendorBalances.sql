-- =============================================
-- Stored Procedure: sp_Admin_GetVendorBalances
-- Description: Gets vendor payment balances
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorBalances]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorBalances];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorBalances]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID as VendorID,
        vp.BusinessName as VendorName,
        u.Email as VendorEmail,
        ISNULL(SUM(CASE WHEN b.Status IN ('Completed', 'completed') THEN b.TotalAmount * 0.9 ELSE 0 END), 0) as AvailableBalance,
        ISNULL(SUM(CASE WHEN b.Status IN ('Confirmed', 'confirmed') THEN b.TotalAmount * 0.9 ELSE 0 END), 0) as PendingBalance,
        ISNULL(SUM(b.TotalAmount * 0.9), 0) as TotalEarned,
        MAX(b.CreatedAt) as LastPayoutDate
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    LEFT JOIN Bookings b ON vp.VendorProfileID = b.VendorProfileID
    WHERE vp.ProfileStatus = 'approved'
    GROUP BY vp.VendorProfileID, vp.BusinessName, u.Email
    ORDER BY TotalEarned DESC;
END
GO
