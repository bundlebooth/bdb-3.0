# PlanHive Frontend - Production Structure

## 📁 Directory Structure

```
frontend/
├── index.html                    # Main application entry point (integrated from index_mobile.html)
├── index_mobile.html             # Original file (kept for reference)
│
├── assets/                       # Static assets
│   └── images/                   # All images and icons
│       ├── planhive_logo.svg
│       ├── planhive_fav_icon.svg
│       └── planhive_fav_icon.png
│
├── css/                          # All stylesheets
│   ├── index_mobile-styles.css   # Main application styles
│   ├── vendor-booking-styles.css # Vendor booking page styles
│   ├── vendor-profile-styles.css # Vendor profile page styles
│   └── main.css                  # Additional styles (if needed)
│
├── js/                           # All JavaScript files
│   ├── index_mobile-script.js    # Main application logic
│   ├── vendor-booking-script.js  # Vendor booking logic
│   ├── vendor-profile-script.js  # Vendor profile logic
│   ├── shared-components.js      # Shared component logic
│   ├── main.js                   # Application entry point
│   └── utils/                    # Utility scripts
│       └── component-loader.js   # Component loading utility
│
└── html/                         # HTML pages and components
    ├── vendor-booking.html       # Vendor booking page
    ├── vendor-profile.html       # Vendor profile page
    └── components/               # Modular components
        ├── navigation/           # Navigation components
        │   ├── header.html
        │   └── categories-nav.html
        ├── shared/               # Shared components
        │   ├── sidebar.html
        │   ├── main-content.html
        │   └── map-sidebar.html
        └── modals/               # Modal components
            ├── dashboard-modal.html
            ├── booking-modal.html
            ├── profile-modal.html
            ├── notifications-dropdown.html
            ├── profile-dropdown.html
            ├── lightbox-modal.html
            ├── confirmation-modal.html
            └── location-permission.html
```

## 🎯 Key Features

### ✅ Organized Directory Structure
- **css/** - All CSS files in one place
- **js/** - All JavaScript files in one place
- **html/** - All HTML files and components in one place
- **assets/** - All static assets (images, fonts, etc.)

### ✅ Integrated index.html
- Main entry point uses content from `index_mobile.html`
- All paths updated to reference new directory structure
- Fully functional and production-ready

### ✅ Clean File Organization
- Easy to find any file type
- Logical grouping of related files
- Scalable structure for future growth

## 🚀 Getting Started

### 1. Start Local Server

```bash
# Navigate to frontend folder
cd "path/to/frontend"

# Start server (choose one):
python -m http.server 8000
# OR
npx http-server -p 8000
# OR
php -S localhost:8000
```

### 2. Open in Browser

```
http://localhost:8000
```

The application will load `index.html` which has all the content from `index_mobile.html` with updated paths.

## 📝 File Path References

All file paths have been updated to reference the new directory structure:

### In index.html:
- CSS: `css/index_mobile-styles.css`
- JS: `js/index_mobile-script.js`
- Images: `assets/images/planhive_logo.svg`

### In html/vendor-booking.html:
- CSS: `../css/vendor-booking-styles.css`
- JS: `../js/vendor-booking-script.js`
- Images: `../assets/images/planhive_logo.svg`

### In html/vendor-profile.html:
- CSS: `../css/vendor-profile-styles.css`
- JS: `../js/vendor-profile-script.js`
- Shared CSS: `../css/index_mobile-styles.css`
- Shared JS: `../js/shared-components.js`

## 🔧 Development Workflow

### Editing Styles
```bash
# Edit main styles
css/index_mobile-styles.css

# Edit vendor booking styles
css/vendor-booking-styles.css

# Edit vendor profile styles
css/vendor-profile-styles.css
```

### Editing JavaScript
```bash
# Edit main application logic
js/index_mobile-script.js

# Edit vendor booking logic
js/vendor-booking-script.js

# Edit vendor profile logic
js/vendor-profile-script.js

# Edit shared components
js/shared-components.js
```

### Editing HTML
```bash
# Edit main page
index.html

# Edit vendor pages
html/vendor-booking.html
html/vendor-profile.html

# Edit components
html/components/navigation/header.html
html/components/shared/sidebar.html
# etc.
```

## 📦 What Changed

### Before:
```
frontend/
├── index_mobile.html
├── index_mobile-styles.css
├── index_mobile-script.js
├── vendor-booking.html
├── vendor-booking-styles.css
├── vendor-booking-script.js
├── vendor-profile.html
├── vendor-profile-styles.css
├── vendor-profile-script.js
├── shared-components.js
├── planhive_logo.svg
├── planhive_fav_icon.svg
└── planhive_fav_icon.png
```

### After:
```
frontend/
├── index.html (integrated from index_mobile.html)
├── css/ (all CSS files)
├── js/ (all JavaScript files)
├── html/ (all HTML files and components)
└── assets/ (all images and static files)
```

## ✅ Benefits

1. **Better Organization** - Files grouped by type
2. **Easier Navigation** - Find files quickly
3. **Cleaner Root** - Less clutter in main directory
4. **Scalable** - Easy to add new files
5. **Professional** - Follows industry standards
6. **Production-Ready** - Clean structure for deployment

## 🎨 Component System

The `html/components/` folder contains modular HTML components that can be loaded dynamically:

- **Navigation Components** - Header, category navigation
- **Shared Components** - Sidebar, main content, map
- **Modal Components** - All popup/overlay interfaces

These can be loaded using the component loader utility in `js/utils/component-loader.js`.

## 📱 Pages

### Main Application
- **index.html** - Main application page with all features

### Vendor Pages
- **html/vendor-booking.html** - Vendor booking request page
- **html/vendor-profile.html** - Vendor profile display page

## 🔐 Assets

All static assets are in the `assets/` folder:

- **images/** - Logos, icons, and images
- Future: fonts/, videos/, documents/

## 🚀 Deployment

For production deployment:

1. All paths are relative and will work on any server
2. No build process required (optional for optimization)
3. Can be deployed to any static hosting service
4. Compatible with CDNs

### Deployment Options:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Traditional web server (Apache/Nginx)
- GitHub Pages

## 📚 Additional Resources

- Original file: `index_mobile.html` (kept for reference)
- Package configuration: `package.json`
- Git ignore rules: `.gitignore`

## 🆘 Troubleshooting

### Images not loading?
- Check that images are in `assets/images/`
- Verify paths use `assets/images/` prefix
- Clear browser cache

### Styles not applying?
- Check that CSS files are in `css/` folder
- Verify paths use `css/` prefix
- Clear browser cache

### JavaScript errors?
- Check that JS files are in `js/` folder
- Verify paths use `js/` prefix
- Check browser console for specific errors

## ✨ Summary

Your frontend is now organized with a clean, professional directory structure:

- ✅ **css/** for all stylesheets
- ✅ **js/** for all JavaScript
- ✅ **html/** for all HTML files and components
- ✅ **assets/** for all static files
- ✅ **index.html** integrated from index_mobile.html
- ✅ All paths updated and working

**The application is production-ready and follows industry best practices!** 🎉
