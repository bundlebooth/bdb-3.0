/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetVendorBookings]
    Description: Gets all bookings for a vendor from the unified view
                 Returns UnifiedStatus AS Status for frontend compatibility
    
    Execution Order: 714
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetVendorBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorBookings]'))
    DROP PROCEDURE [bookings].[sp_GetVendorBookings];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorBookings]
    @VendorProfileID INT
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
        EventLocation, EventName, EventType, TimeZone, GroupID,
        ClientName, ClientEmail, ClientPhone, ClientProfilePic, ClientPublicId,
        VendorName, VendorEmail, VendorPhone, VendorLogo, VendorPublicId,
        ServiceName, ServiceCategory, ConversationID,
        StatusLabel, StatusCategory
    FROM bookings.vw_UnifiedBookings 
    WHERE VendorProfileID = @VendorProfileID 
    ORDER BY EventDate DESC;
END;
GO

PRINT 'Stored procedure [bookings].[sp_GetVendorBookings] created successfully.';
GO
