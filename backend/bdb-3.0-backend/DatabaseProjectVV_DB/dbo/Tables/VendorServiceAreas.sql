CREATE TABLE [dbo].[VendorServiceAreas] (
    [VendorServiceAreaID]  INT             IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]      INT             NOT NULL,
    [GooglePlaceID]        NVARCHAR (100)  NOT NULL,
    [CityName]             NVARCHAR (100)  NOT NULL,
    [State/Province]       NVARCHAR (100)  NOT NULL,
    [Country]              NVARCHAR (100)  NOT NULL,
    [Latitude]             DECIMAL (9, 6)  NULL,
    [Longitude]            DECIMAL (9, 6)  NULL,
    [ServiceRadius]        DECIMAL (10, 2) DEFAULT ((25.0)) NULL,
    [IsActive]             BIT             DEFAULT ((1)) NOT NULL,
    [FormattedAddress]     NVARCHAR (255)  NULL,
    [BoundsNortheastLat]   DECIMAL (9, 6)  NULL,
    [BoundsNortheastLng]   DECIMAL (9, 6)  NULL,
    [BoundsSouthwestLat]   DECIMAL (9, 6)  NULL,
    [BoundsSouthwestLng]   DECIMAL (9, 6)  NULL,
    [PlaceType]            NVARCHAR (50)   NULL,
    [PostalCode]           NVARCHAR (20)   NULL,
    [TravelCost]           DECIMAL (10, 2) NULL,
    [MinimumBookingAmount] DECIMAL (10, 2) NULL,
    [CreatedDate]          DATETIME        DEFAULT (getdate()) NOT NULL,
    [LastModifiedDate]     DATETIME        DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([VendorServiceAreaID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorServiceAreas_CityState]
    ON [dbo].[VendorServiceAreas]([CityName] ASC, [State/Province] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorServiceAreas_GooglePlaceID]
    ON [dbo].[VendorServiceAreas]([GooglePlaceID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorServiceAreas_VendorProfileID]
    ON [dbo].[VendorServiceAreas]([VendorProfileID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorServiceAreas_Location]
    ON [dbo].[VendorServiceAreas]([Latitude] ASC, [Longitude] ASC);


GO

