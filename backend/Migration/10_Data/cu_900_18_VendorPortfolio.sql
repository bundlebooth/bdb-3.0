/*
    Migration Script: Data - [VendorPortfolio]
    Phase: 900 - Data
    Script: cu_900_18_dbo.VendorPortfolio.sql
    Description: Inserts data into [dbo].[VendorPortfolio]
    
    Execution Order: 18
    Record Count: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[VendorPortfolio]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[VendorPortfolio])
BEGIN
    SET IDENTITY_INSERT [dbo].[VendorPortfolio] ON;

    INSERT [dbo].[VendorPortfolio] ([PortfolioID], [VendorProfileID], [Title], [Description], [ImageURL], [ProjectDate], [DisplayOrder], [CreatedAt]) VALUES (1, 3, N'Sunset Wedding', N'A stunning wedding captured at sunset.', N'https://placehold.co/1000x800/d1fae5/065f46?text=Portfolio+Shot+1', NULL, 0, CAST(N'2025-08-12T22:11:28.100' AS DateTime));

    SET IDENTITY_INSERT [dbo].[VendorPortfolio] OFF;

    PRINT 'Inserted 1 records into [dbo].[VendorPortfolio].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorPortfolio] already contains data. Skipping.';
END
GO
