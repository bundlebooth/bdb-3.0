/*
    Migration Script: Create Performance Indexes
    Description: Adds indexes to frequently queried columns and foreign keys for better performance
    
    Execution Order: 10
*/

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Creating performance indexes...';
GO

-- =============================================
-- Bookings schema indexes
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.Bookings') AND name = 'IX_Bookings_UserID')
    CREATE INDEX IX_Bookings_UserID ON bookings.Bookings(UserID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.Bookings') AND name = 'IX_Bookings_VendorProfileID')
    CREATE INDEX IX_Bookings_VendorProfileID ON bookings.Bookings(VendorProfileID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.Bookings') AND name = 'IX_Bookings_Status')
    CREATE INDEX IX_Bookings_Status ON bookings.Bookings(Status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.Bookings') AND name = 'IX_Bookings_EventDate')
    CREATE INDEX IX_Bookings_EventDate ON bookings.Bookings(EventDate);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.BookingServices') AND name = 'IX_BookingServices_BookingID')
    CREATE INDEX IX_BookingServices_BookingID ON bookings.BookingServices(BookingID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.BookingExpenses') AND name = 'IX_BookingExpenses_BookingID')
    CREATE INDEX IX_BookingExpenses_BookingID ON bookings.BookingExpenses(BookingID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.BookingTimeline') AND name = 'IX_BookingTimeline_BookingID')
    CREATE INDEX IX_BookingTimeline_BookingID ON bookings.BookingTimeline(BookingID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('bookings.BookingCancellations') AND name = 'IX_BookingCancellations_BookingID')
    CREATE INDEX IX_BookingCancellations_BookingID ON bookings.BookingCancellations(BookingID);
GO

-- =============================================
-- Vendors schema indexes
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'IX_VendorProfiles_UserID')
    CREATE INDEX IX_VendorProfiles_UserID ON vendors.VendorProfiles(UserID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.VendorProfiles') AND name = 'IX_VendorProfiles_ProfileStatus')
    CREATE INDEX IX_VendorProfiles_ProfileStatus ON vendors.VendorProfiles(ProfileStatus);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.Services') AND name = 'IX_Services_VendorProfileID')
    CREATE INDEX IX_Services_VendorProfileID ON vendors.Services(VendorProfileID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.Reviews') AND name = 'IX_Reviews_VendorProfileID')
    CREATE INDEX IX_Reviews_VendorProfileID ON vendors.Reviews(VendorProfileID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.VendorFAQs') AND name = 'IX_VendorFAQs_VendorProfileID')
    CREATE INDEX IX_VendorFAQs_VendorProfileID ON vendors.VendorFAQs(VendorProfileID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('vendors.VendorImages') AND name = 'IX_VendorImages_VendorProfileID')
    CREATE INDEX IX_VendorImages_VendorProfileID ON vendors.VendorImages(VendorProfileID);
GO

-- =============================================
-- Messages schema indexes
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('messages.Messages') AND name = 'IX_Messages_ConversationID')
    CREATE INDEX IX_Messages_ConversationID ON messages.Messages(ConversationID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('messages.Conversations') AND name = 'IX_Conversations_UserID')
    CREATE INDEX IX_Conversations_UserID ON messages.Conversations(UserID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('messages.Conversations') AND name = 'IX_Conversations_VendorProfileID')
    CREATE INDEX IX_Conversations_VendorProfileID ON messages.Conversations(VendorProfileID);
GO

-- =============================================
-- Invoices and Payments schema indexes
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('invoices.Invoices') AND name = 'IX_Invoices_BookingID')
    CREATE INDEX IX_Invoices_BookingID ON invoices.Invoices(BookingID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('invoices.Invoices') AND name = 'IX_Invoices_UserID')
    CREATE INDEX IX_Invoices_UserID ON invoices.Invoices(UserID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('invoices.Invoices') AND name = 'IX_Invoices_VendorProfileID')
    CREATE INDEX IX_Invoices_VendorProfileID ON invoices.Invoices(VendorProfileID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('payments.Transactions') AND name = 'IX_Transactions_BookingID')
    CREATE INDEX IX_Transactions_BookingID ON payments.Transactions(BookingID);
GO

PRINT 'Performance indexes created successfully.';
GO
