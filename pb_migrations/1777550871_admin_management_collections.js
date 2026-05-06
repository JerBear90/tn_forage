/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ---------------------------------------------------------------
  // 1. admin_notifications
  // ---------------------------------------------------------------
  const notifications = new Collection({
    type: "base",
    name: "admin_notifications",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: '@request.auth.role = "super_user"',
    updateRule: '@request.auth.role = "super_user"',
    deleteRule: '@request.auth.role = "super_user"',
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "body",
        type: "editor",
        required: true,
      },
      {
        name: "linkUrl",
        type: "text",
        required: false,
      },
      {
        name: "targetType",
        type: "text",
        required: true,
      },
      {
        name: "targetValue",
        type: "text",
        required: false,
      },
      {
        name: "recipientCount",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "sentAt",
        type: "date",
        required: true,
      },
      {
        name: "sentBy",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
      {
        name: "status",
        type: "text",
        required: true,
      },
    ],
    indexes: [
      "CREATE INDEX idx_notifications_sentAt ON admin_notifications (sentAt)",
      "CREATE INDEX idx_notifications_status ON admin_notifications (status)",
      "CREATE INDEX idx_notifications_sentBy ON admin_notifications (sentBy)",
    ],
  })
  app.save(notifications)

  // ---------------------------------------------------------------
  // 2. admin_alerts
  // ---------------------------------------------------------------
  const alerts = new Collection({
    type: "base",
    name: "admin_alerts",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: '@request.auth.role = "super_user"',
    updateRule: '@request.auth.role = "super_user"',
    deleteRule: '@request.auth.role = "super_user"',
    fields: [
      {
        name: "type",
        type: "text",
        required: true,
      },
      {
        name: "severity",
        type: "text",
        required: true,
      },
      {
        name: "status",
        type: "text",
        required: true,
      },
      {
        name: "message",
        type: "text",
        required: true,
      },
      {
        name: "metricValue",
        type: "number",
        required: true,
      },
      {
        name: "threshold",
        type: "number",
        required: true,
      },
      {
        name: "detectedAt",
        type: "date",
        required: true,
      },
      {
        name: "resolvedAt",
        type: "date",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_alerts_type ON admin_alerts (type)",
      "CREATE INDEX idx_alerts_status ON admin_alerts (status)",
      "CREATE INDEX idx_alerts_detectedAt ON admin_alerts (detectedAt)",
      "CREATE INDEX idx_alerts_severity ON admin_alerts (severity)",
    ],
  })
  app.save(alerts)

  // ---------------------------------------------------------------
  // 3. admin_moderation_log
  // ---------------------------------------------------------------
  const moderationLog = new Collection({
    type: "base",
    name: "admin_moderation_log",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: '@request.auth.role = "super_user"',
    updateRule: '@request.auth.role = "super_user"',
    deleteRule: '@request.auth.role = "super_user"',
    fields: [
      {
        name: "targetId",
        type: "text",
        required: true,
      },
      {
        name: "targetType",
        type: "text",
        required: true,
      },
      {
        name: "action",
        type: "text",
        required: true,
      },
      {
        name: "moderatorId",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
      {
        name: "timestamp",
        type: "date",
        required: true,
      },
      {
        name: "reason",
        type: "editor",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_moderation_targetId ON admin_moderation_log (targetId)",
      "CREATE INDEX idx_moderation_targetType ON admin_moderation_log (targetType)",
      "CREATE INDEX idx_moderation_action ON admin_moderation_log (action)",
      "CREATE INDEX idx_moderation_timestamp ON admin_moderation_log (timestamp)",
    ],
  })
  app.save(moderationLog)

  // ---------------------------------------------------------------
  // 4. admin_alert_config
  // ---------------------------------------------------------------
  const alertConfig = new Collection({
    type: "base",
    name: "admin_alert_config",
    listRule: '@request.auth.role = "super_user"',
    viewRule: '@request.auth.role = "super_user"',
    createRule: '@request.auth.role = "super_user"',
    updateRule: '@request.auth.role = "super_user"',
    deleteRule: '@request.auth.role = "super_user"',
    fields: [
      {
        name: "errorSpikeMultiplier",
        type: "number",
        required: true,
        min: 1,
      },
      {
        name: "trafficDropThreshold",
        type: "number",
        required: true,
        min: 0,
        max: 1,
      },
      {
        name: "connectionFailureMinutes",
        type: "number",
        required: true,
        min: 1,
      },
      {
        name: "emailRecipients",
        type: "json",
        required: false,
      },
      {
        name: "updatedAt",
        type: "date",
        required: true,
      },
      {
        name: "updatedBy",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
      },
    ],
    indexes: [],
  })
  app.save(alertConfig)
}, (app) => {
  // Down migration: remove collections in reverse order
  const collections = [
    "admin_alert_config",
    "admin_moderation_log",
    "admin_alerts",
    "admin_notifications",
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
