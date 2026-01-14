/*
    Migration Script: Create Stored Procedure [users].[sp_GetUnifiedBookings]
    Description: Gets all bookings for a user with optional status filter
    
    Execution Order: 704
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUnifiedBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUnifiedBookings]'))
    DROP PROCEDURE [users].[sp_GetUnifiedBookings];
GO

CREATE PROCEDURE [users].[sp_GetUnifiedBookings]
    @UserID INT,
    @StatusFilter NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BookingID, RequestID, UserID, VendorProfileID, ServiceID,
        BookingDate, EventDate, EndDate, EventTime, EventEndTime,
        UnifiedStatus AS Status, OriginalStatus,
        TotalAmount, Budget, DepositAmount, DepositPaid, FullAmountPaid,
        AttendeeCount, SpecialRequests, Services,
        ResponseMessage, ProposedPrice, ExpiresAt, RespondedAt, ConfirmedAt,
        CancellationDate, CancelledAt, CancellationReason, CancelledBy,
        DeclinedReason, ExpiredAt, RefundAmount,
        StripePaymentIntentID, CreatedAt, UpdatedAt,
        EventLocation, EventLocation AS Location,
        EventName, EventType, TimeZone, GroupID,
        ClientName, ClientEmail, ClientPhone, ClientPublicId,
        VendorName, VendorEmail, VendorPhone, VendorLogo, VendorPublicId,
        ServiceName, ServiceCategory, ConversationID,
        StatusLabel, StatusCategory
    FROM bookings.vw_UnifiedBookings
    WHERE UserID = @UserID
      AND (@StatusFilter IS NULL OR StatusCategory = @StatusFilter)
    ORDER BY 
        CASE WHEN UnifiedStatus = 'pending' THEN 0 ELSE 1 END,
        EventDate DESC;
END;
GO

PRINT 'Stored procedure [users].[sp_GetUnifiedBookings] created successfully.';
GO
