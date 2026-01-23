-- ============================================================
-- Get vendor reports for admin review
-- ============================================================
IF OBJECT_ID('vendors.sp_GetVendorReports', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetVendorReports;
GO

CREATE PROCEDURE vendors.sp_GetVendorReports
    @Status NVARCHAR(20) = NULL,
    @VendorProfileID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReportID,
        r.VendorProfileID,
        vp.BusinessName,
        r.ReportedByUserID,
        u.FirstName + ' ' + u.LastName AS ReportedByName,
        u.Email AS ReportedByEmail,
        r.Reason,
        r.Details,
        r.Status,
        r.AdminNotes,
        r.CreatedAt,
        r.ReviewedAt,
        r.ReviewedByAdminID
    FROM vendors.VendorReports r
    INNER JOIN vendors.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    LEFT JOIN users.Users u ON r.ReportedByUserID = u.UserID
    WHERE (@Status IS NULL OR r.Status = @Status)
      AND (@VendorProfileID IS NULL OR r.VendorProfileID = @VendorProfileID)
    ORDER BY r.CreatedAt DESC;
END
GO
