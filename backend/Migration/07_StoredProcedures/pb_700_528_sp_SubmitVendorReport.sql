-- ============================================================
-- Submit a vendor listing report
-- ============================================================
IF OBJECT_ID('vendors.sp_SubmitVendorReport', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SubmitVendorReport;
GO

CREATE PROCEDURE vendors.sp_SubmitVendorReport
    @VendorProfileID INT,
    @ReportedByUserID INT = NULL,
    @Reason NVARCHAR(50),
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorReports (VendorProfileID, ReportedByUserID, Reason, Details)
    VALUES (@VendorProfileID, @ReportedByUserID, @Reason, @Details);
    
    SELECT 'success' AS Status, 'Report submitted successfully' AS Message, SCOPE_IDENTITY() AS ReportID;
END
GO
