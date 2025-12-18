# Frontend Testing Guide for Stored Procedures

This guide provides manual test cases to verify that the refactored backend (using stored procedures) works correctly.

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Database with all stored procedures deployed
- Test user account (regular user)
- Test admin account
- Test vendor account

---

## 1. ADMIN PANEL TESTS

### 1.1 Dashboard Stats (`sp_Admin_GetDashboardStats`)
**Location:** Admin Panel → Dashboard
**Steps:**
1. Log in as admin
2. Navigate to Admin Panel
3. Check that dashboard shows:
   - Total Vendors count
   - Pending Vendors count
   - Total Users count
   - Total Bookings count
   - Monthly Revenue
   - Active Listings count

**Expected:** All stats display correctly without errors

---

### 1.2 Environment Info (`sp_Admin_GetEnvironmentInfo`)
**Location:** Admin Panel → Dashboard (Environment section)
**Steps:**
1. Log in as admin
2. Navigate to Admin Panel
3. Look for environment/server info section

**Expected:** Shows database server name, database name, SQL version

---

### 1.3 Recent Activity (`sp_Admin_GetRecentActivity`)
**Location:** Admin Panel → Dashboard
**Steps:**
1. Log in as admin
2. Navigate to Admin Panel
3. Check "Recent Activity" section

**Expected:** Shows recent vendor registrations, bookings, and reviews

---

### 1.4 Vendor Approvals (`sp_Admin_GetVendorApprovals`)
**Location:** Admin Panel → Vendor Approvals
**Steps:**
1. Log in as admin
2. Navigate to Vendor Approvals section
3. Filter by status: pending, approved, rejected, all

**Expected:** Vendor list displays with correct filtering

---

### 1.5 Approve Vendor (`sp_Admin_ApproveVendor`)
**Location:** Admin Panel → Vendor Approvals
**Steps:**
1. Log in as admin
2. Find a pending vendor
3. Click "Approve" button
4. Add optional admin notes
5. Confirm approval

**Expected:** 
- Vendor status changes to "approved"
- Vendor becomes visible on platform
- Success message displayed

---

### 1.6 Reject Vendor (`sp_Admin_RejectVendor`)
**Location:** Admin Panel → Vendor Approvals
**Steps:**
1. Log in as admin
2. Find a pending vendor
3. Click "Reject" button
4. Enter rejection reason
5. Confirm rejection

**Expected:**
- Vendor status changes to "rejected"
- Vendor hidden from platform
- Success message displayed

---

### 1.7 Suspend Vendor (`sp_Admin_SuspendVendor`)
**Location:** Admin Panel → Vendor Management
**Steps:**
1. Log in as admin
2. Find an active vendor
3. Click "Suspend" button
4. Enter suspension reason
5. Confirm suspension

**Expected:**
- Vendor is suspended
- Vendor hidden from platform
- Success message displayed

---

### 1.8 Toggle Vendor Visibility (`sp_Admin_ToggleVendorVisibility`)
**Location:** Admin Panel → Vendor Management
**Steps:**
1. Log in as admin
2. Find a vendor
3. Click visibility toggle button
4. Verify visibility changed

**Expected:** Vendor visibility toggles between visible/hidden

---

### 1.9 User Management (`sp_Admin_GetUsers`)
**Location:** Admin Panel → Users
**Steps:**
1. Log in as admin
2. Navigate to Users section
3. Test filters: active, inactive, vendors, clients
4. Test search by name/email
5. Test pagination

**Expected:** User list displays correctly with all filters working

---

### 1.10 Toggle User Status (`sp_Admin_ToggleUserStatus`)
**Location:** Admin Panel → Users
**Steps:**
1. Log in as admin
2. Find a user
3. Click "Toggle Status" button

**Expected:** User active status toggles

---

### 1.11 Update User (`sp_Admin_UpdateUser`)
**Location:** Admin Panel → Users → Edit User
**Steps:**
1. Log in as admin
2. Find a user and click Edit
3. Change name or email
4. Save changes

**Expected:** User details updated successfully

---

### 1.12 User Details (`sp_Admin_GetUserDetails`)
**Location:** Admin Panel → Users → View User
**Steps:**
1. Log in as admin
2. Click on a user to view details

**Expected:** Shows user info, booking count, review count

---

### 1.13 User Activity (`sp_Admin_GetUserActivity`)
**Location:** Admin Panel → Users → User Activity
**Steps:**
1. Log in as admin
2. View a user's activity log

**Expected:** Shows user's bookings and reviews

---

### 1.14 Booking Details (`sp_Admin_GetBookingDetails`)
**Location:** Admin Panel → Bookings → View Booking
**Steps:**
1. Log in as admin
2. Navigate to Bookings
3. Click on a booking to view details

**Expected:** Shows full booking details with client and vendor info

---

### 1.15 Update Booking (`sp_Admin_UpdateBooking`)
**Location:** Admin Panel → Bookings → Edit Booking
**Steps:**
1. Log in as admin
2. Find a booking and click Edit
3. Change status, date, or amount
4. Save changes

**Expected:** Booking updated successfully

---

### 1.16 Cancel Booking (`sp_Admin_CancelBooking`)
**Location:** Admin Panel → Bookings
**Steps:**
1. Log in as admin
2. Find an active booking
3. Click "Cancel" button
4. Enter cancellation reason
5. Confirm cancellation

**Expected:** Booking status changes to "Cancelled"

---

## 2. MESSAGING TESTS

### 2.1 Get Conversations (`sp_Messages_GetUserConversations`)
**Location:** Messages section
**Steps:**
1. Log in as any user
2. Navigate to Messages
3. View conversation list

**Expected:** All user's conversations display with last message preview

---

### 2.2 Unread Count (`sp_Messages_GetUnreadCount`)
**Location:** Header notification badge
**Steps:**
1. Log in as any user
2. Check message notification badge in header

**Expected:** Shows correct unread message count

---

### 2.3 Start Conversation (`sp_Messages_CheckExistingConversation`, `sp_Messages_CreateConversationDirect`)
**Location:** Vendor Profile → Contact
**Steps:**
1. Log in as regular user
2. Go to a vendor profile
3. Click "Contact" or "Message" button
4. Send a message

**Expected:** 
- If conversation exists, opens existing conversation
- If new, creates new conversation
- Message sent successfully

---

### 2.4 Support Conversation (`sp_Messages_CheckSupportConversation`, `sp_Messages_CreateSupportConversation`)
**Location:** Help/Support section
**Steps:**
1. Log in as any user
2. Navigate to Support/Help
3. Start a support conversation

**Expected:**
- If support conversation exists, opens it
- If new, creates support conversation with welcome message

---

## 3. VENDOR DASHBOARD TESTS

### 3.1 Vendor Analytics (`sp_VendorDashboard_GetAnalytics`)
**Location:** Vendor Dashboard → Analytics
**Steps:**
1. Log in as vendor
2. Navigate to Vendor Dashboard
3. View Analytics section

**Expected:** Shows:
- Booking stats (completed, confirmed, pending, cancelled)
- Revenue by service
- Revenue by month
- Review stats

---

### 3.2 Vendor Bookings (`sp_VendorDashboard_GetAllBookings`)
**Location:** Vendor Dashboard → Bookings
**Steps:**
1. Log in as vendor
2. Navigate to Vendor Dashboard
3. View all bookings

**Expected:** Shows all bookings for this vendor with client info

---

### 3.3 Vendor Setup Status (`sp_VendorDashboard_GetSetupStatus`)
**Location:** Vendor Dashboard → Setup Progress
**Steps:**
1. Log in as vendor
2. Check setup progress/status

**Expected:** Shows completion status for each setup step

---

## 4. QUICK SMOKE TEST CHECKLIST

Run through these quickly to verify basic functionality:

| Test | Location | Action | Pass/Fail |
|------|----------|--------|-----------|
| Admin Dashboard loads | Admin Panel | View dashboard | ☐ |
| Vendor list loads | Admin → Vendors | View list | ☐ |
| User list loads | Admin → Users | View list | ☐ |
| Booking list loads | Admin → Bookings | View list | ☐ |
| Messages load | Messages | View conversations | ☐ |
| Vendor analytics load | Vendor Dashboard | View analytics | ☐ |
| Vendor bookings load | Vendor Dashboard | View bookings | ☐ |
| Contact vendor works | Vendor Profile | Send message | ☐ |
| Approve vendor works | Admin → Vendors | Approve one | ☐ |
| Toggle user status works | Admin → Users | Toggle one | ☐ |

---

## 5. ERROR HANDLING TESTS

### 5.1 Invalid IDs
**Steps:**
1. Try to access a non-existent user: `/admin/users/99999`
2. Try to access a non-existent booking: `/admin/bookings/99999`
3. Try to access a non-existent vendor: `/admin/vendors/99999`

**Expected:** 404 error with appropriate message

---

### 5.2 Unauthorized Access
**Steps:**
1. Log in as regular user (not admin)
2. Try to access admin endpoints

**Expected:** 401/403 error, redirected to login or access denied

---

## 6. CONSOLE ERROR CHECK

For each test above, also check browser console (F12 → Console) for:
- No JavaScript errors
- No failed API calls (red entries in Network tab)
- No 500 server errors

---

## Notes

- If any test fails, check the backend console for error messages
- Stored procedure errors will show in the backend logs
- Database connection issues will prevent all tests from working
- Make sure all stored procedures are deployed before testing
