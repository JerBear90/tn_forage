/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ---------------------------------------------------------------
  // 1. analytics_page_views
  // ---------------------------------------------------------------
  const pageViews = new Collection({
    type: "base",
    name: "analytics_page_views",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "path",
        type: "text",
        required: true,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "sessionId",
        type: "text",
        required: true,
      },
      {
        name: "userId",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
    ],
    indexes: [
      "CREATE INDEX idx_page_views_timestamp ON analytics_page_views (timestamp)",
      "CREATE INDEX idx_page_views_sessionId ON analytics_page_views (sessionId)",
      "CREATE INDEX idx_page_views_path ON analytics_page_views (path)",
    ],
  })
  app.save(pageViews)

  // ---------------------------------------------------------------
  // 2. analytics_errors
  // ---------------------------------------------------------------
  const errors = new Collection({
    type: "base",
    name: "analytics_errors",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: '@request.auth.role = "super_user"',
    deleteRule: null,
    fields: [
      {
        name: "message",
        type: "text",
        required: true,
      },
      {
        name: "stack",
        type: "editor",
        required: false,
      },
      {
        name: "pageUrl",
        type: "text",
        required: true,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "browser",
        type: "text",
        required: false,
      },
      {
        name: "userId",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
      {
        name: "resolved",
        type: "bool",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_errors_timestamp ON analytics_errors (timestamp)",
      "CREATE INDEX idx_errors_pageUrl ON analytics_errors (pageUrl)",
      "CREATE INDEX idx_errors_resolved ON analytics_errors (resolved)",
    ],
  })
  app.save(errors)

  // ---------------------------------------------------------------
  // 3. analytics_feedback
  // ---------------------------------------------------------------
  const feedback = new Collection({
    type: "base",
    name: "analytics_feedback",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "rating",
        type: "number",
        required: true,
        min: 1,
        max: 5,
      },
      {
        name: "message",
        type: "editor",
        required: false,
      },
      {
        name: "pageUrl",
        type: "text",
        required: true,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "userId",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
      {
        name: "deviceInfo",
        type: "json",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_feedback_timestamp ON analytics_feedback (timestamp)",
      "CREATE INDEX idx_feedback_rating ON analytics_feedback (rating)",
      "CREATE INDEX idx_feedback_userId ON analytics_feedback (userId)",
    ],
  })
  app.save(feedback)

  // ---------------------------------------------------------------
  // 4. analytics_usage_events
  // ---------------------------------------------------------------
  const usageEvents = new Collection({
    type: "base",
    name: "analytics_usage_events",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "featureKey",
        type: "text",
        required: true,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "sessionId",
        type: "text",
        required: true,
      },
      {
        name: "userId",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
    ],
    indexes: [
      "CREATE INDEX idx_usage_events_timestamp ON analytics_usage_events (timestamp)",
      "CREATE INDEX idx_usage_events_featureKey ON analytics_usage_events (featureKey)",
      "CREATE INDEX idx_usage_events_sessionId ON analytics_usage_events (sessionId)",
    ],
  })
  app.save(usageEvents)

  // ---------------------------------------------------------------
  // 5. analytics_search_queries
  // ---------------------------------------------------------------
  const searchQueries = new Collection({
    type: "base",
    name: "analytics_search_queries",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "term",
        type: "text",
        required: true,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "resultsCount",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "clickedResult",
        type: "bool",
        required: false,
      },
      {
        name: "userId",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
    ],
    indexes: [
      "CREATE INDEX idx_search_queries_timestamp ON analytics_search_queries (timestamp)",
      "CREATE INDEX idx_search_queries_term ON analytics_search_queries (term)",
    ],
  })
  app.save(searchQueries)

  // ---------------------------------------------------------------
  // 6. analytics_sessions
  // ---------------------------------------------------------------
  const sessions = new Collection({
    type: "base",
    name: "analytics_sessions",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      {
        name: "sessionId",
        type: "text",
        required: true,
      },
      {
        name: "userId",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
      {
        name: "startedAt",
        type: "date",
        required: true,
      },
      {
        name: "endedAt",
        type: "date",
        required: true,
      },
      {
        name: "duration",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "pageCount",
        type: "number",
        required: true,
        min: 0,
      },
    ],
    indexes: [
      "CREATE INDEX idx_sessions_sessionId ON analytics_sessions (sessionId)",
      "CREATE INDEX idx_sessions_startedAt ON analytics_sessions (startedAt)",
      "CREATE INDEX idx_sessions_userId ON analytics_sessions (userId)",
    ],
  })
  app.save(sessions)
}, (app) => {
  // Down migration: remove collections in reverse order
  const collections = [
    "analytics_sessions",
    "analytics_search_queries",
    "analytics_usage_events",
    "analytics_feedback",
    "analytics_errors",
    "analytics_page_views",
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
