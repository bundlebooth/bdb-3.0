CREATE TABLE [dbo].[VendorAdditionalDetails] (
    [DetailID]        INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NOT NULL,
    [QuestionID]      INT            NOT NULL,
    [Answer]          NVARCHAR (MAX) NOT NULL,
    [CreatedAt]       DATETIME2 (7)  DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]       DATETIME2 (7)  DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([DetailID] ASC),
    FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[CategoryQuestions] ([QuestionID]) ON DELETE CASCADE,
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]) ON DELETE CASCADE
);


GO

