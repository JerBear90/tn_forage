/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Add 'role' field to the users collection if it doesn't exist
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Check if role field already exists
  const existingField = collection.fields.find((f) => f.name === "role")
  if (!existingField) {
    collection.fields.add(new Field({
      name: "role",
      type: "select",
      required: false,
      values: ["free", "member", "super_user"],
    }))
    app.save(collection)
  }

  // Set jerameeflemming@gmail.com as super_user
  try {
    const record = app.findAuthRecordByEmail("users", "jerameeflemming@gmail.com")
    if (record) {
      record.set("role", "super_user")
      app.save(record)
      console.log("Set jerameeflemming@gmail.com role to super_user")
    } else {
      console.log("User jerameeflemming@gmail.com not found in users collection")
    }
  } catch (e) {
    console.log("Could not update user role:", e)
  }
}, (app) => {
  // Down migration: remove role field
  try {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")
    const roleField = collection.fields.find((f) => f.name === "role")
    if (roleField) {
      collection.fields.removeById(roleField.id)
      app.save(collection)
    }
  } catch (e) {
    // ignore
  }
})
