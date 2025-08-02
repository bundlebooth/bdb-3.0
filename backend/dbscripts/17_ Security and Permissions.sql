-- Section 17: Security and Permissions

-- Create database roles
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingAdmin' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingAdmin;
    GRANT CONTROL ON DATABASE::EventBookingPlatform TO EventBookingAdmin;
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingProvider' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingProvider;
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingProvider;
    -- Provider-specific permissions
    GRANT INSERT, UPDATE ON ServiceProviders TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderServices TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderServicePackages TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderAvailability TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderBlackoutDates TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderEquipment TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderPortfolio TO EventBookingProvider;
    GRANT INSERT, UPDATE ON ProviderLocations TO EventBookingProvider;
    -- Booking-related permissions
    GRANT SELECT, UPDATE ON Bookings TO EventBookingProvider;
    GRANT SELECT, UPDATE ON BookingProviders TO EventBookingProvider;
    GRANT SELECT, INSERT, UPDATE ON BookingMessages TO EventBookingProvider;
    GRANT SELECT ON BookingTimeline TO EventBookingProvider;
    -- Financial permissions
    GRANT SELECT ON Payments TO EventBookingProvider;
    GRANT SELECT ON Payouts TO EventBookingProvider;
    GRANT SELECT ON Invoices TO EventBookingProvider;
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingCustomer' AND type = 'R')
BEGIN
    CREATE ROLE EventBookingCustomer;
    -- Basic read permissions
    GRANT SELECT ON SCHEMA::dbo TO EventBookingCustomer;
    -- User-specific permissions
    GRANT INSERT, UPDATE ON Users TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON UserPreferences TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON UserSocialLogins TO EventBookingCustomer;
    GRANT INSERT, UPDATE ON Wishlists TO EventBookingCustomer;
    -- Booking-related permissions
    GRANT INSERT, SELECT, UPDATE ON Bookings TO EventBookingCustomer;
    GRANT SELECT ON BookingProviders TO EventBookingCustomer;
    GRANT SELECT, INSERT ON BookingMessages TO EventBookingCustomer;
    GRANT SELECT ON BookingTimeline TO EventBookingCustomer;
    -- Financial permissions
    GRANT SELECT, INSERT ON Payments TO EventBookingCustomer;
    GRANT SELECT ON Invoices TO EventBookingCustomer;
END
GO

-- Create application user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EventBookingApp' AND type = 'S')
BEGIN
    CREATE USER EventBookingApp WITH PASSWORD = 'StrongPassword123!';
    GRANT CONNECT TO EventBookingApp;
    GRANT EXECUTE ON SCHEMA::dbo TO EventBookingApp;
END
GO
