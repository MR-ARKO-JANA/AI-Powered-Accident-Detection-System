package com.apads.voicesos

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

/**
 * OfflineQueueDB
 *
 * SQLite-backed store-and-forward queue for SOS alerts.
 * When the network is unavailable, alerts are persisted locally
 * and flushed to the APADS backend when connectivity returns.
 *
 * This mirrors the exact same pattern used in the Python AI service
 * (ai-service/app.py → offline_alerts.db).
 *
 * Schema:
 *   id        INTEGER PRIMARY KEY AUTOINCREMENT
 *   payload   TEXT (JSON string)
 *   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
 *   retries   INTEGER DEFAULT 0
 */
class OfflineQueueDB(context: Context) : SQLiteOpenHelper(
    context, DATABASE_NAME, null, DATABASE_VERSION
) {
    companion object {
        const val TAG = "OfflineQueueDB"
        const val DATABASE_NAME = "sos_offline_queue.db"
        const val DATABASE_VERSION = 1
        const val TABLE_NAME = "sos_queue"
        const val MAX_RETRIES = 10
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE $TABLE_NAME (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                retries INTEGER DEFAULT 0
            )
        """)
        Log.i(TAG, "✅ Offline SOS queue database created")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_NAME")
        onCreate(db)
    }

    /**
     * Queue an SOS payload for later delivery.
     * @return the row ID of the inserted record, or -1 on failure.
     */
    fun enqueue(jsonPayload: String): Long {
        return try {
            val db = writableDatabase
            val values = ContentValues().apply {
                put("payload", jsonPayload)
            }
            val id = db.insert(TABLE_NAME, null, values)
            Log.i(TAG, "💾 SOS queued offline (id=$id)")
            id
        } catch (e: Exception) {
            Log.e(TAG, "Failed to queue SOS: ${e.message}")
            -1
        }
    }

    /**
     * Retrieve all pending (un-sent) alerts.
     * @return List of (id, payload) pairs.
     */
    fun getPending(): List<Pair<Long, String>> {
        val results = mutableListOf<Pair<Long, String>>()
        try {
            val db = readableDatabase
            val cursor = db.rawQuery(
                "SELECT id, payload FROM $TABLE_NAME WHERE retries < $MAX_RETRIES ORDER BY id ASC",
                null
            )
            while (cursor.moveToNext()) {
                val id = cursor.getLong(0)
                val payload = cursor.getString(1)
                results.add(Pair(id, payload))
            }
            cursor.close()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read pending alerts: ${e.message}")
        }
        return results
    }

    /**
     * Remove a successfully sent alert from the queue.
     */
    fun dequeue(id: Long) {
        try {
            val db = writableDatabase
            db.delete(TABLE_NAME, "id = ?", arrayOf(id.toString()))
            Log.i(TAG, "✅ Dequeued SOS alert (id=$id)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to dequeue alert $id: ${e.message}")
        }
    }

    /**
     * Increment the retry counter for a failed delivery.
     */
    fun incrementRetry(id: Long) {
        try {
            val db = writableDatabase
            db.execSQL("UPDATE $TABLE_NAME SET retries = retries + 1 WHERE id = ?", arrayOf(id))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to increment retry for $id: ${e.message}")
        }
    }

    /**
     * Get the count of pending alerts.
     */
    fun pendingCount(): Int {
        return try {
            val db = readableDatabase
            val cursor = db.rawQuery("SELECT COUNT(*) FROM $TABLE_NAME WHERE retries < $MAX_RETRIES", null)
            cursor.moveToFirst()
            val count = cursor.getInt(0)
            cursor.close()
            count
        } catch (e: Exception) {
            0
        }
    }
}
