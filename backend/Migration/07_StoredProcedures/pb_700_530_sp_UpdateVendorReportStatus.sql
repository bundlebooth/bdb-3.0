-- ============================================================
-- Update vendor report status (admin)
-- ============================================================
IF OBJECT_ID('vendors.sp_UpdateVendorReportStatus', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_UpdateVendorReportStatus;
GO

CREATE PROCEDURE vendors.sp_UpdateVendorReportStatus
    @ReportID INT,
    @Status NVARCHAR(20),
    @AdminNotes NVARCHAR(MAX) = NULL,
    @AdminID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorReports
    SET Status = @Status,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        ReviewedByAdminID = @AdminID
    WHERE ReportID = @ReportID;
    
    IF @@ROWCOUNT = 0
        SELECT 'error' AS Status, 'Report not found' AS Message;
    ELSE
        SELECT 'success' AS Status, 'Report updated successfully' AS Message;
END
GO
