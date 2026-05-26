// Model Imports
// This file ensures all models are imported and registered with Sequelize

import Admin from './Admin.js';
import Artist from './Artist.js';
import Release from './Release.js';
import Track from './Track.js';
import Platform from './Platform.js';
import ReleasePlatform from './ReleasePlatform.js';
import Notification from './Notification.js';
import SiteContent from './SiteContent.js';

// Define relationships here to avoid circular dependency issues

// Artist has many Releases
Artist.hasMany(Release, {
  foreignKey: 'artistId',
  as: 'releases',
});

// Artist has many Notifications
Artist.hasMany(Notification, {
  foreignKey: 'artistId',
  as: 'notifications',
});

// Release has many Tracks
Release.hasMany(Track, {
  foreignKey: 'releaseId',
  as: 'tracks',
});

// Artist has many Releases (already defined above, but kept for clarity)
// Release.belongsTo(Artist, {
//   foreignKey: 'artistId',
//   as: 'artist',
// }); // Already defined in Release.ts

// Track.belongsTo(Release, {
//   foreignKey: 'releaseId',
//   as: 'release',
// }); // Already defined in Track.ts

// ReleasePlatform relationships are defined in ReleasePlatform.ts

// Export Models

export {
  Admin,
  Artist,
  Release,
  Track,
  Platform,
  ReleasePlatform,
  Notification,
  SiteContent,
};
