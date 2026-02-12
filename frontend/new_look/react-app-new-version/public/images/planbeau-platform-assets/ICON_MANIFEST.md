# Planbeau Platform Assets - Icon Manifest

This document provides a centralized reference for all icons and media assets used across the Planbeau platform (app, emails, notifications).

## Folder Structure

```
public/images/planbeau-platform-assets/
├── icons/
│   ├── ui/                    # App UI icons (24x24 SVG, stroke-based)
│   ├── status/                # Status indicator icons
│   └── notification/          # Notification-specific icons
├── badges/                    # Vendor badges (guest favorite, verified, etc.)
├── branding/                  # Logos, favicons
└── illustrations/             # Decorative assets (crowns, etc.)

public/images/email-icons/     # Email-specific icons (64x64 with colored backgrounds)
```

---

## UI Icons (`/icons/ui/`)

These are 24x24 SVG icons using `stroke="currentColor"` for flexible coloring.

| Icon | File | Usage |
|------|------|-------|
| Check Circle | `check-circle.svg` | Success states, confirmations |
| Check | `check.svg` | Checkmarks, selections |
| X Circle | `x-circle.svg` | Errors, cancellations, close |
| Calendar | `calendar.svg` | Date pickers, bookings |
| Calendar Plus | `calendar-plus.svg` | New booking requests |
| Bell | `bell.svg` | Notifications |
| Heart | `heart.svg` | Favorites |
| Star | `star.svg` | Reviews, ratings |
| Envelope | `envelope.svg` | Messages, email |
| Clock | `clock.svg` | Time, reminders |
| Dollar Sign | `dollar-sign.svg` | Payments, pricing |
| Credit Card | `credit-card.svg` | Payment methods |
| User | `user.svg` | Profile, account |
| Lock | `lock.svg` | Security, locked |
| Unlock | `unlock.svg` | Unlocked states |
| Gift | `gift.svg` | Promotions, rewards |
| Message Square | `message-square.svg` | Chat, support |
| File Text | `file-text.svg` | Documents, invoices |
| Tag | `tag.svg` | Promotions, labels |
| Megaphone | `megaphone.svg` | Announcements |
| Ban | `ban.svg` | Cancelled, blocked |
| Refresh CW | `refresh-cw.svg` | Updates, sync |
| Alert Circle | `alert-circle.svg` | Warnings, alerts |
| Info | `info.svg` | Information |
| Map Pin | `map-pin.svg` | Location |
| Search | `search.svg` | Search functionality |
| Newspaper | `newspaper.svg` | News, blog, newsletter |

---

## Email Icons (`/images/email-icons/`)

These are 64x64 SVG icons with colored circular backgrounds, designed for email templates.

| Icon | File | Color | Usage |
|------|------|-------|-------|
| Check Green | `icon-check-green.svg` | Green (#34a853) | Success, confirmed |
| Calendar Blue | `icon-calendar-blue.svg` | Blue (#4285f4) | Bookings |
| Bell Yellow | `icon-bell-yellow.svg` | Yellow (#fbbc04) | Notifications |
| Alert Yellow | `icon-alert-yellow.svg` | Yellow (#fbbc04) | Warnings |
| Clock Yellow | `icon-clock-yellow.svg` | Yellow (#fbbc04) | Reminders |
| Dollar Green | `icon-dollar-green.svg` | Green (#34a853) | Payments |
| Gift Purple | `icon-gift-purple.svg` | Purple (#9c27b0) | Promotions |
| Heart Red | `icon-heart-red.svg` | Red (#ea4335) | Favorites |
| Lock Blue | `icon-lock-blue.svg` | Blue (#4285f4) | Security |
| Lock Red | `icon-lock-red.svg` | Red (#ea4335) | Account locked |
| Message Blue | `icon-message-blue.svg` | Blue (#4285f4) | Messages |
| Receipt Green | `icon-receipt-green.svg` | Green (#34a853) | Invoices |
| Star Yellow | `icon-star-yellow.svg` | Yellow (#fbbc04) | Reviews |
| Support Blue | `icon-support-blue.svg` | Blue (#4285f4) | Support |
| Unlock Green | `icon-unlock-green.svg` | Green (#34a853) | Account unlocked |
| User Blue | `icon-user-blue.svg` | Blue (#4285f4) | Profile |
| X Red | `icon-x-red.svg` | Red (#ea4335) | Errors, declined |

---

## Notification Icon Mapping

For consistent notification styling across the app, use the centralized `NotificationIconStyles` from `AppIcons.js`:

```javascript
import { getNotificationIconStyle } from './components/common/AppIcons';

const style = getNotificationIconStyle('booking_confirmed');
// Returns: { icon: 'fa-check-circle', iconColor: '#10b981', bgColor: '#5086E8' }
```

### Notification Types

| Type | Icon | Color |
|------|------|-------|
| `booking_request` | fa-calendar-plus | White |
| `booking_approved` | fa-check-circle | Green (#10b981) |
| `booking_confirmed` | fa-check-circle | Green (#10b981) |
| `booking_declined` | fa-times-circle | Red (#ef4444) |
| `booking_cancelled` | fa-ban | Red (#ef4444) |
| `booking_reminder` | fa-clock | Yellow (#fbbf24) |
| `booking_update` | fa-sync | Purple (#a78bfa) |
| `message` | fa-envelope | White |
| `payment` | fa-credit-card | Green (#34d399) |
| `payment_received` | fa-dollar-sign | Green (#34d399) |
| `invoice` | fa-file-invoice-dollar | Purple (#c4b5fd) |
| `review` | fa-star | Yellow (#fbbf24) |
| `promotion` | fa-tag | Orange (#fb923c) |
| `newsletter` | fa-newspaper | Cyan (#67e8f9) |
| `announcement` | fa-bullhorn | Yellow (#fbbf24) |

---

## Usage Guidelines

### In React Components

```javascript
// Option 1: Use Icons component
import { Icons } from './components/common/AppIcons';
<Icons.Check size={20} color="#10b981" />

// Option 2: Use Icon class names
import { IconClasses } from './components/common/AppIcons';
<i className={`fas ${IconClasses.check}`}></i>

// Option 3: Use SVG paths
import { SvgIconPaths } from './components/common/AppIcons';
<img src={SvgIconPaths['check-circle']} alt="Success" />
```

### In Email Templates

```html
<img src="https://yourdomain.com/images/email-icons/icon-check-green.svg" 
     alt="Success" width="64" height="64" />
```

### For Notifications

```javascript
import { getNotificationIconStyle } from './components/common/AppIcons';

const style = getNotificationIconStyle(notification.type);
<i className={`fas ${style.icon}`} style={{ color: style.iconColor }} />
```

---

## Design Specifications

### UI Icons
- **Size**: 24x24 viewBox
- **Stroke**: 2px, round caps and joins
- **Color**: `currentColor` (inherits from CSS)
- **Style**: Outline/hollow (Airbnb-style)

### Email Icons
- **Size**: 64x64 viewBox
- **Background**: Circular, colored
- **Inner icon**: 24x24, centered with `translate(20, 20)`
- **Stroke**: 2px white

---

## Adding New Icons

1. Create SVG following the design specs above
2. Place in appropriate folder (`ui/`, `email-icons/`, etc.)
3. Add to `SvgIconPaths` or `EmailIconPaths` in `AppIcons.js`
4. Update this manifest

---

## Unified Notification Icons (`/icons/notification/`)

These are 64x64 SVG icons with colored circular backgrounds, designed to be shared across:
- **Email templates**
- **Notification dropdowns**
- **Profile activity feeds**
- **Modals with status icons**

### Booking Notifications

| Icon | File | Background | Icon Color | Usage |
|------|------|------------|------------|-------|
| Booking Request | `notif-booking-request.svg` | Blue (#5086E8) | White | New booking requests |
| Booking Approved | `notif-booking-approved.svg` | Blue (#5086E8) | Green (#10b981) | Approved bookings |
| Booking Confirmed | `notif-booking-confirmed.svg` | Blue (#5086E8) | Green (#10b981) | Confirmed bookings |
| Booking Declined | `notif-booking-declined.svg` | Blue (#5086E8) | Red (#ef4444) | Declined bookings |
| Booking Cancelled | `notif-booking-cancelled.svg` | Blue (#5086E8) | Red (#ef4444) | Cancelled bookings |
| Booking Reminder | `notif-booking-reminder.svg` | Blue (#5086E8) | Yellow (#fbbf24) | Reminders |
| Booking Update | `notif-booking-update.svg` | Blue (#5086E8) | Purple (#a78bfa) | Updates |

### Communication Notifications

| Icon | File | Background | Icon Color | Usage |
|------|------|------------|------------|-------|
| Message | `notif-message.svg` | Blue (#5086E8) | White | Messages |
| Support | `notif-support.svg` | Blue (#5086E8) | White | Support chats |
| Newsletter | `notif-newsletter.svg` | Blue (#5086E8) | Cyan (#67e8f9) | Newsletters |
| Announcement | `notif-announcement.svg` | Blue (#5086E8) | Yellow (#fbbf24) | Announcements |

### Payment Notifications

| Icon | File | Background | Icon Color | Usage |
|------|------|------------|------------|-------|
| Payment | `notif-payment.svg` | Blue (#5086E8) | Green (#34d399) | Payments |
| Payment Received | `notif-payment-received.svg` | Blue (#5086E8) | Green (#34d399) | Payment received |
| Payment Reminder | `notif-payment-reminder.svg` | Blue (#5086E8) | Yellow (#fbbf24) | Payment reminders |
| Invoice | `notif-invoice.svg` | Blue (#5086E8) | Purple (#c4b5fd) | Invoices |

### Other Notifications

| Icon | File | Background | Icon Color | Usage |
|------|------|------------|------------|-------|
| Review | `notif-review.svg` | Blue (#5086E8) | Yellow (#fbbf24) | Reviews |
| Promotion | `notif-promotion.svg` | Blue (#5086E8) | Orange (#fb923c) | Promotions |
| General | `notif-general.svg` | Blue (#5086E8) | White | Default notifications |
| Calendar | `notif-calendar.svg` | Blue (#5086E8) | White | Calendar events |
| User | `notif-user.svg` | Blue (#5086E8) | White | User-related |
| Heart | `notif-heart.svg` | Blue (#5086E8) | Red (#ef4444) | Favorites |
| Lock | `notif-lock.svg` | Blue (#5086E8) | White | Security |
| Gift | `notif-gift.svg` | Blue (#5086E8) | Purple (#c4b5fd) | Gifts/rewards |

### Status Icons (for Modals/Banners)

| Icon | File | Background | Icon Color | Usage |
|------|------|------------|------------|-------|
| Success | `notif-success.svg` | Green (#10b981) | White | Success states |
| Error | `notif-error.svg` | Red (#ef4444) | White | Error states |
| Warning | `notif-warning.svg` | Yellow (#fbbf24) | White | Warnings |
| Info | `notif-info.svg` | Blue (#5086E8) | White | Information |

---

## Using Unified Notification Icons

### In React Components

```javascript
import { getUnifiedNotificationIcon } from './components/common/AppIcons';

// Get icon path by notification type
const iconPath = getUnifiedNotificationIcon('booking_approved');
// Returns: '/images/planbeau-platform-assets/icons/notification/notif-booking-approved.svg'

// Use in JSX
<img 
  src={iconPath} 
  alt="Booking approved" 
  style={{ width: 40, height: 40 }}
/>
```

### In Email Templates

```html
<img 
  src="https://yourdomain.com/images/planbeau-platform-assets/icons/notification/notif-booking-approved.svg" 
  alt="Booking Approved" 
  width="64" 
  height="64" 
/>
```

### In Notification Components

```javascript
import { UnifiedNotificationIcons } from './components/common/AppIcons';

const NotificationIcon = ({ type }) => (
  <img 
    src={UnifiedNotificationIcons[type] || UnifiedNotificationIcons['notification']}
    alt={type}
    className="notification-icon"
  />
);
```

---

*Last updated: February 2026*
