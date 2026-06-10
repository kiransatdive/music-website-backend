// Model Imports
// This file ensures all models are imported and registered with Sequelize

import Admin from "./Admin.ts";
import Artist from "./Artist.ts";
import Release from "./Release.ts";
import Track from "./Track.ts";
import Platform from "./Platform.ts";
import ReleasePlatform from "./ReleasePlatform.ts";
import Notification from "./Notification.ts";
import SiteContent from "./SiteContent.ts";
import PricingPlan from "./PricingPlan.ts";
import WhitelistDomain from "./WhitelistDomain.ts";
import YoutubeCriteria from "./YoutubeCriteria.ts";
import RoyaltyReport from "./RoyaltyReport.ts";

import AdminNotification from "./AdminNotification.ts";

// Define relationships here to avoid circular dependency issues

// Artist has many Releases
Artist.hasMany(Release, {
  foreignKey: "artistId",
  as: "releases",
});

// Artist has many Notifications
Artist.hasMany(Notification, {
  foreignKey: "artistId",
  as: "notifications",
});

// Release has many Tracks
Release.hasMany(Track, {
  foreignKey: "releaseId",
  as: "tracks",
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
  AdminNotification,
  SiteContent,
  PricingPlan,
  WhitelistDomain,
  YoutubeCriteria,
  RoyaltyReport,
};
