-- Section 17: Security and Permissions

-- Create database roles
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingAdmin' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingAdmin;
GO
    GRANT CONTROL ON DATABASE::EventBookingPlatform TO EventBookingAdmin;
GO
END
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingProvider' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingProvider;
GO
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingProvider;
GO
    -- Provider-specific permissions
    GRANT INSERT, UPDATE ON ServiceProviders TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderServices TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderServicePackages TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderAvailability TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderBlackoutDates TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderEquipment TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderPortfolio TO EventBookingProvider;
GO
    GRANT INSERT, UPDATE ON ProviderLocations TO EventBookingProvider;
GO
    -- Booking-related permissions
    GRANT SELECT, UPDATE ON Bookings TO EventBookingProvider;
GO
    GRANT SELECT, UPDATE ON BookingProviders TO EventBookingProvider;
GO
    GRANT SELECT, INSERT, UPDATE ON BookingMessages TO EventBookingProvider;
GO
    GRANT SELECT ON BookingTimeline TO EventBookingProvider;
GO
    -- Financial permissions
    GRANT SELECT ON Payments TO EventBookingProvider;
GO
    GRANT SELECT ON Payouts TO EventBookingProvider;
GO
    GRANT SELECT ON Invoices TO EventBookingProvider;
GO
END
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingCustomer' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingCustomer;
GO
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingCustomer;
GO
    -- User-specific permissions
    GRANT INSERT, UPDATE ON Users TO EventBookingCustomer;
GO
    GRANT INSERT, UPDATE ON UserPreferences TO EventBookingCustomer;
GO
    GRANT INSERT, UPDATE ON UserSocialLogins TO EventBookingCustomer;
GO
    GRANT INSERT, UPDATE ON Wishlists TO EventBookingCustomer;
GO
    -- Booking-related permissions
    GRANT INSERT, SELECT, UPDATE ON Bookings TO EventBookingCustomer;
GO
    GRANT SELECT ON BookingProviders TO EventBookingCustomer;
GO
    GRANT SELECT, INSERT ON BookingMessages TO EventBookingCustomer;
GO
    GRANT SELECT ON BookingTimeline TO EventBookingCustomer;
GO
    -- Financial permissions
    GRANT SELECT, INSERT ON Payments TO EventBookingCustomer;
GO
    GRANT SELECT ON Invoices TO EventBookingCustomer;
GO
END
GO
-- Create application user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingApp' AND type = 'S')
BEGIN
    CREATE USER EventBookingApp WITH PASSWORD = 'StrongPassword123!';
GO
    GRANT CONNECT TO EventBookingApp;
GO
    GRANT EXECUTE ON SCHEMA::dbo TO EventBookingApp;
GO
END
GO
