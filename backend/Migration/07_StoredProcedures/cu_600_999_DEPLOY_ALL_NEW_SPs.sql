-- =============================================
-- DEPLOYMENT GUIDE: All New Stored Procedures for Backend Refactoring
-- Description: This file lists all stored procedures created for the
--              backend refactoring to eliminate inline SQL queries.
-- Phase: 600 (Stored Procedures)
-- Date: 2024
-- 
-- INSTRUCTIONS: Run each .sql file individually in SQL Server Management Studio
--               in the order listed below, OR use the following command in SQLCMD:
--               sqlcmd -S YourServer -d YourDatabase -i "filename.sql"
-- =============================================

/*
==================== DEPLOYMENT ORDER ====================

Run these files in order from the 07_StoredProcedures folder:

-- ADMIN STORED PROCEDURES (cu_600_200 - cu_600_282)
1.  cu_600_200_sp_Admin_GetDashboardStats.sql
2.  cu_600_201_sp_Admin_GetEnvironmentInfo.sql
3.  cu_600_202_sp_Admin_GetPlatformHealth.sql
4.  cu_600_203_sp_Admin_GetRecentActivity.sql
5.  cu_600_204_sp_Admin_GetVendorApprovals.sql
6.  cu_600_205_sp_Admin_ApproveVendor.sql
7.  cu_600_206_sp_Admin_RejectVendor.sql
8.  cu_600_207_sp_Admin_SuspendVendor.sql
9.  cu_600_208_sp_Admin_ToggleVendorVisibility.sql
10. cu_600_209_sp_Admin_SetVendorVisibility.sql
11. cu_600_210_sp_Admin_GetUsers.sql
12. cu_600_211_sp_Admin_ToggleUserStatus.sql
13. cu_600_212_sp_Admin_UpdateUser.sql
14. cu_600_213_sp_Admin_GetUserDetails.sql
15. cu_600_214_sp_Admin_GetUserActivity.sql
16. cu_600_215_sp_Admin_GetBookingDetails.sql
17. cu_600_216_sp_Admin_GetVendors.sql
18. cu_600_280_sp_Admin_UpdateBooking.sql
19. cu_600_281_sp_Admin_CancelBooking.sql
20. cu_600_282_sp_Admin_GetReviews.sql

-- MESSAGES STORED PROCEDURES (cu_600_220 - cu_600_227)
21. cu_600_220_sp_Messages_GetConversationDetails.sql
22. cu_600_221_sp_Messages_GetVendorUserID.sql
23. cu_600_222_sp_Messages_GetUserConversations.sql
24. cu_600_223_sp_Messages_CheckExistingConversation.sql
25. cu_600_224_sp_Messages_GetUnreadCount.sql
26. cu_600_225_sp_Messages_CreateConversationDirect.sql
27. cu_600_226_sp_Messages_CheckSupportConversation.sql
28. cu_600_227_sp_Messages_CreateSupportConversation.sql

-- USERS STORED PROCEDURES (cu_600_230 - cu_600_233)
29. cu_600_230_sp_Users_LogSecurityEvent.sql
30. cu_600_231_sp_Users_Get2FASettings.sql
31. cu_600_232_sp_Users_Insert2FACode.sql
32. cu_600_233_sp_Users_UpdateLastLogin.sql

-- VENDORS STORED PROCEDURES (cu_600_240 - cu_600_244)
33. cu_600_240_sp_Vendors_GetPredefinedServices.sql
34. cu_600_241_sp_Vendors_GetImages.sql
35. cu_600_242_sp_Vendors_GetStripeAccountID.sql
36. cu_600_243_sp_Vendors_UpdateStripeAccountID.sql
37. cu_600_244_sp_Vendors_ResolveProfileID.sql

-- BOOKINGS STORED PROCEDURES (cu_600_250 - cu_600_251)
38. cu_600_250_sp_Bookings_GetVendorProfileID.sql
39. cu_600_251_sp_Bookings_CreateRequest.sql

-- PAYMENTS STORED PROCEDURES (cu_600_260 - cu_600_262)
40. cu_600_260_sp_Payments_GetCommissionSettings.sql
41. cu_600_261_sp_Payments_RecordTransaction.sql
42. cu_600_262_sp_Payments_CheckDuplicateTransaction.sql

-- VENDOR DASHBOARD STORED PROCEDURES (cu_600_270 - cu_600_272)
43. cu_600_270_sp_VendorDashboard_GetAnalytics.sql
44. cu_600_271_sp_VendorDashboard_GetAllBookings.sql
45. cu_600_272_sp_VendorDashboard_GetSetupStatus.sql

==================== VERIFICATION ====================

After deployment, run this query to verify all procedures exist:

SELECT name, create_date, modify_date 
FROM sys.procedures 
WHERE name LIKE 'sp_Admin_%' 
   OR name LIKE 'sp_Messages_%'
   OR name LIKE 'sp_Users_%'
   OR name LIKE 'sp_Vendors_%'
   OR name LIKE 'sp_Bookings_%'
   OR name LIKE 'sp_Payments_%'
   OR name LIKE 'sp_VendorDashboard_%'
ORDER BY name;

*/
