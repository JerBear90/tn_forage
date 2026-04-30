/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ---------------------------------------------------------------
  // 1. follows
  // ---------------------------------------------------------------
  const follows = new Collection({
    type: "base",
    name: "follows",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.id = followerId",
    updateRule: "@request.auth.id != '' && @request.auth.id = followerId",
    deleteRule: "@request.auth.id != '' && @request.auth.id = followerId",
    fields: [
      {
        name: "followerId",
        type: "text",
        required: true,
      },
      {
        name: "followedId",
        type: "text",
        required: true,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_follows_unique ON follows (followerId, followedId)",
      "CREATE INDEX idx_follows_followerId ON follows (followerId)",
      "CREATE INDEX idx_follows_followedId ON follows (followedId)",
    ],
  })
  app.save(follows)

  // ---------------------------------------------------------------
  // 2. reviews
  // ---------------------------------------------------------------
  const reviews = new Collection({
    type: "base",
    name: "reviews",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.id = userId",
    updateRule: "@request.auth.id != '' && @request.auth.id = userId",
    deleteRule: "@request.auth.id != '' && @request.auth.id = userId",
    fields: [
      {
        name: "userId",
        type: "text",
        required: true,
      },
      {
        name: "targetType",
        type: "select",
        required: true,
        values: ["park", "trail", "species"],
      },
      {
        name: "targetId",
        type: "text",
        required: true,
      },
      {
        name: "rating",
        type: "number",
        required: true,
        min: 1,
        max: 5,
      },
      {
        name: "text",
        type: "text",
        required: true,
        min: 10,
        max: 2000,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_reviews_unique ON reviews (userId, targetType, targetId)",
      "CREATE INDEX idx_reviews_userId ON reviews (userId)",
      "CREATE INDEX idx_reviews_target ON reviews (targetType, targetId)",
    ],
  })
  app.save(reviews)

  // ---------------------------------------------------------------
  // 3. social_photos
  // ---------------------------------------------------------------
  const socialPhotos = new Collection({
    type: "base",
    name: "social_photos",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.id = userId",
    updateRule: "@request.auth.id != '' && @request.auth.id = userId",
    deleteRule: "@request.auth.id != '' && @request.auth.id = userId",
    fields: [
      {
        name: "userId",
        type: "text",
        required: true,
      },
      {
        name: "targetType",
        type: "select",
        required: true,
        values: ["park", "trail", "species"],
      },
      {
        name: "targetId",
        type: "text",
        required: true,
      },
      {
        name: "file",
        type: "file",
        required: true,
        maxSelect: 1,
        maxSize: 10485760, // 10 MB
        mimeTypes: ["image/jpeg", "image/png"],
      },
      {
        name: "caption",
        type: "text",
        required: false,
        max: 500,
      },
      {
        name: "hasLocation",
        type: "bool",
        required: false,
      },
      {
        name: "coordinates",
        type: "json",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_social_photos_userId ON social_photos (userId)",
      "CREATE INDEX idx_social_photos_target ON social_photos (targetType, targetId)",
    ],
  })
  app.save(socialPhotos)

  // ---------------------------------------------------------------
  // 4. achievements
  // ---------------------------------------------------------------
  const achievements = new Collection({
    type: "base",
    name: "achievements",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.id = userId",
    updateRule: "@request.auth.id != '' && @request.auth.id = userId",
    deleteRule: "@request.auth.id != '' && @request.auth.id = userId",
    fields: [
      {
        name: "userId",
        type: "text",
        required: true,
      },
      {
        name: "achievementId",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "text",
        required: false,
      },
      {
        name: "earnedAt",
        type: "date",
        required: true,
      },
    ],
    indexes: [
      "CREATE INDEX idx_achievements_userId ON achievements (userId)",
      "CREATE UNIQUE INDEX idx_achievements_unique ON achievements (userId, achievementId)",
    ],
  })
  app.save(achievements)

  // ---------------------------------------------------------------
  // 5. activity_feed
  // ---------------------------------------------------------------
  const activityFeed = new Collection({
    type: "base",
    name: "activity_feed",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.id = userId",
    updateRule: "@request.auth.id != '' && @request.auth.id = userId",
    deleteRule: "@request.auth.id != '' && @request.auth.id = userId",
    fields: [
      {
        name: "userId",
        type: "text",
        required: true,
      },
      {
        name: "actionType",
        type: "select",
        required: true,
        values: ["review_posted", "photo_shared", "trip_completed", "achievement_earned"],
      },
      {
        name: "targetType",
        type: "text",
        required: true,
      },
      {
        name: "targetId",
        type: "text",
        required: true,
      },
      {
        name: "metadata",
        type: "json",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_activity_feed_userId ON activity_feed (userId)",
    ],
  })
  app.save(activityFeed)
}, (app) => {
  // Down migration: remove collections in reverse order
  const collections = [
    "activity_feed",
    "achievements",
    "social_photos",
    "reviews",
    "follows",
  ]

  for (const name of collections) {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
    } catch (e) {
      // collection may not exist, ignore
    }
  }
})
