// utils/db.js
// IndexedDB helper using the 'idb' library for clean async/await usage

import { openDB } from 'idb'

const DB_NAME = 'DhyanDB'
const DB_VERSION = 2

// Open/upgrade the database
export const getDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create all stores if they don't exist
      const stores = ['habits', 'tasks', 'goals', 'notes', 'dailyLog']
      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id', autoIncrement: true })
        }
      })
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
    },
  })

// Get all records from a store
export async function getAll(store) {
  const db = await getDB()
  return db.getAll(store)
}

// Put (insert or update) a record
export async function put(store, record) {
  const db = await getDB()
  return db.put(store, record)
}

// Delete a record by id
export async function remove(store, id) {
  const db = await getDB()
  return db.delete(store, id)
}

// Get a single record by key
export async function get(store, key) {
  const db = await getDB()
  return db.get(store, key)
}

// Save app settings (key-value)
export async function saveSetting(key, value) {
  const db = await getDB()
  return db.put('settings', value, key)
}

// Get a setting by key
export async function getSetting(key) {
  const db = await getDB()
  return db.get('settings', key)
}
