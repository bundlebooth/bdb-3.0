-- Section 8: Indexes for Performance

-- Users table indexes
CREATE INDEX IX_Users_Email ON Users(Email);
GO
CREATE INDEX IX_Users_LastName_FirstName ON Users(LastName, FirstName);
GO
-- ServiceProviders table indexes
CREATE INDEX IX_ServiceProviders_TypeID ON ServiceProviders(TypeID);
GO
CREATE INDEX IX_ServiceProviders_UserID ON ServiceProviders(UserID);
GO
CREATE INDEX IX_ServiceProviders_IsActive ON ServiceProviders(IsActive) WHERE IsActive = 1;
GO
-- Bookings table indexes
CREATE INDEX IX_Bookings_UserID ON Bookings(UserID);
GO
CREATE INDEX IX_Bookings_EventTypeID ON Bookings(EventTypeID);
GO
CREATE INDEX IX_Bookings_StatusID ON Bookings(StatusID);
GO
CREATE INDEX IX_Bookings_EventDate ON Bookings(EventDate);
GO
-- Payments table indexes
CREATE INDEX IX_Payments_BookingID ON Payments(BookingID);
GO
CREATE INDEX IX_Payments_UserID ON Payments(UserID);
GO
CREATE INDEX IX_Payments_ProviderID ON Payments(ProviderID);
GO
CREATE INDEX IX_Payments_Status ON Payments(Status);
GO
-- ProviderReviews table indexes
CREATE INDEX IX_ProviderReviews_ProviderID ON ProviderReviews(ProviderID);
GO
CREATE INDEX IX_ProviderReviews_UserID ON ProviderReviews(UserID);
GO
CREATE INDEX IX_ProviderReviews_IsApproved ON ProviderReviews(IsApproved) WHERE IsApproved = 1;
GO
-- Spatial index for location-based searches
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProviderLocations' AND type = 'U')
BEGIN
    IF COL_LENGTH('ProviderLocations', 'Latitude') IS NOT NULL AND COL_LENGTH('ProviderLocations', 'Longitude') IS NOT NULL
    BEGIN
        -- Add geography column for spatial queries
        ALTER TABLE ProviderLocations ADD GeoLocation AS geography::Point(Latitude, Longitude, 4326);
GO
        -- Create spatial index
        CREATE SPATIAL INDEX SIX_ProviderLocations_GeoLocation ON ProviderLocations(GeoLocation);
GO
    END
END
GO
