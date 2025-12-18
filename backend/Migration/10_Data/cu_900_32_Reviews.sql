/*
    Migration Script: Data - [Reviews]
    Phase: 900 - Data
    Script: cu_900_32_dbo.Reviews.sql
    Description: Inserts data into [vendors].[Reviews]
    
    Execution Order: 32
    Record Count: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[Reviews]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[Reviews])
BEGIN
    SET IDENTITY_INSERT [vendors].[Reviews] ON;

    INSERT [vendors].[Reviews] ([ReviewID], [UserID], [VendorProfileID], [BookingID], [Rating], [Title], [Comment], [Response], [ResponseDate], [IsAnonymous], [IsFeatured], [IsApproved], [CreatedAt], [UpdatedAt], [IsFlagged], [FlagReason], [AdminNotes]) VALUES (1, 3, 3, 1, 5, N'Absolutely fantastic!', N'John and his team were amazing. They captured every special moment beautifully. Highly recommend!', NULL, NULL, 0, 0, 1, CAST(N'2025-08-12T22:11:28.393' AS DateTime), CAST(N'2025-08-12T22:11:28.393' AS DateTime), NULL, NULL, NULL);
    INSERT [vendors].[Reviews] ([ReviewID], [UserID], [VendorProfileID], [BookingID], [Rating], [Title], [Comment], [Response], [ResponseDate], [IsAnonymous], [IsFeatured], [IsApproved], [CreatedAt], [UpdatedAt], [IsFlagged], [FlagReason], [AdminNotes]) VALUES (2, 1, 16, NULL, 5, NULL, N'TEST', NULL, NULL, 0, 0, 0, CAST(N'2025-08-13T04:05:54.767' AS DateTime), CAST(N'2025-08-13T04:05:54.767' AS DateTime), NULL, NULL, NULL);

    SET IDENTITY_INSERT [vendors].[Reviews] OFF;

    PRINT 'Inserted 2 records into [vendors].[Reviews].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[Reviews] already contains data. Skipping.';
END
GO
