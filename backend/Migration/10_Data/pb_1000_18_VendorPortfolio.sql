/*
    Migration Script: Data - [VendorPortfolio]
    Phase: 900 - Data
    Script: cu_900_18_dbo.VendorPortfolio.sql
    Description: Inserts data into [vendors].[VendorPortfolio]
    
    Execution Order: 18
    Record Count: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorPortfolio]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorPortfolio])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorPortfolio] ON;

    INSERT [vendors].[VendorPortfolio] ([PortfolioID], [VendorProfileID], [Title], [Description], [ImageURL], [ProjectDate], [DisplayOrder], [CreatedAt]) VALUES (1, 3, N'Sunset Wedding', N'A stunning wedding captured at sunset.', N'https://placehold.co/1000x800/d1fae5/065f46?text=Portfolio+Shot+1', NULL, 0, CAST(N'2025-08-12T22:11:28.100' AS DateTime));

    SET IDENTITY_INSERT [vendors].[VendorPortfolio] OFF;

    PRINT 'Inserted 1 records into [vendors].[VendorPortfolio].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorPortfolio] already contains data. Skipping.';
END
GO
