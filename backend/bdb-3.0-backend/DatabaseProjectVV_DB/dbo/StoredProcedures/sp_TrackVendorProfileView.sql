
-- =============================================
-- Stored Procedure: sp_TrackVendorProfileView
-- Logs a vendor profile view
-- =============================================
CREATE   PROCEDURE [dbo].[sp_TrackVendorProfileView]
    @VendorProfileID INT,
    @ViewerUserID INT = NULL,
    @IPAddress VARCHAR(45) = NULL,
    @UserAgent VARCHAR(500) = NULL,
    @ReferrerUrl VARCHAR(1000) = NULL,
    @SessionID VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate vendor exists
    IF NOT EXISTS (SELECT 1 FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID)
    BEGIN
        RAISERROR('Vendor not found', 16, 1);
        RETURN;
    END

    -- Insert the view record
    INSERT INTO VendorProfileViews (
        VendorProfileID, 
        ViewerUserID, 
        ViewedAt, 
        IPAddress, 
        UserAgent, 
        ReferrerUrl, 
        SessionID
    )
    VALUES (
        @VendorProfileID,
        @ViewerUserID,
        GETUTCDATE(),
        @IPAddress,
        @UserAgent,
        @ReferrerUrl,
        @SessionID
    );

    SELECT 
        SCOPE_IDENTITY() AS ViewID,
        GETUTCDATE() AS ViewedAt;
END

GO

