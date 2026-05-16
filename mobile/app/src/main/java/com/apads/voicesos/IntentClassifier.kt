package com.apads.voicesos

/**
 * IntentClassifier
 *
 * Lightweight, offline keyword-based emergency domain classifier.
 * No ML model required — uses weighted keyword matching for
 * deterministic, auditable results.
 *
 * Domains:
 *   - Medical: ambulance, heart attack, bleeding, injury, etc.
 *   - Fire:    fire, burning, smoke, explosion, etc.
 *   - Police:  robbery, attack, assault, weapon, etc.
 *
 * Confidence Scoring:
 *   Each keyword hit adds to the domain's score. The domain with the
 *   highest weighted score wins. Confidence = normalized score (0.0-1.0).
 *   If no keywords match, defaults to Medical with low confidence (0.3).
 */
object IntentClassifier {

    data class ClassificationResult(
        val domain: String,       // "Medical", "Fire", or "Police"
        val confidence: Float,    // 0.0 to 1.0
        val matchedKeywords: List<String>
    )

    // ── Keyword Dictionaries with Weights ────────────────────────────

    private val MEDICAL_KEYWORDS = mapOf(
        // High-signal keywords (weight 3)
        "ambulance" to 3, "heart attack" to 3, "cardiac" to 3,
        "stroke" to 3, "not breathing" to 3, "unconscious" to 3,
        "medical" to 3, "doctor" to 3, "hospital" to 3,

        // Medium-signal keywords (weight 2)
        "bleeding" to 2, "broken" to 2, "fracture" to 2,
        "injured" to 2, "injury" to 2, "pain" to 2,
        "choking" to 2, "seizure" to 2, "diabetic" to 2,
        "allergic" to 2, "overdose" to 2, "poisoned" to 2,
        "accident" to 2, "crash" to 2, "fallen" to 2,

        // Low-signal keywords (weight 1)
        "help" to 1, "hurt" to 1, "sick" to 1,
        "fainted" to 1, "dizzy" to 1, "blood" to 1,
        "wound" to 1, "medicine" to 1, "emergency" to 1,
    )

    private val FIRE_KEYWORDS = mapOf(
        // High-signal
        "fire" to 3, "burning" to 3, "flames" to 3,
        "fire brigade" to 3, "fire department" to 3, "fire truck" to 3,

        // Medium-signal
        "smoke" to 2, "explosion" to 2, "gas leak" to 2,
        "trapped" to 2, "building" to 2, "arson" to 2,
        "electrical fire" to 2, "short circuit" to 2,

        // Low-signal
        "hot" to 1, "smell" to 1, "evacuate" to 1,
        "escape" to 1, "exit" to 1,
    )

    private val POLICE_KEYWORDS = mapOf(
        // High-signal
        "police" to 3, "robbery" to 3, "robbed" to 3,
        "assault" to 3, "weapon" to 3, "gun" to 3,
        "knife" to 3, "murder" to 3, "kidnapped" to 3,
        "terrorist" to 3,

        // Medium-signal
        "attack" to 2, "attacked" to 2, "threatening" to 2,
        "stalker" to 2, "break in" to 2, "breaking in" to 2,
        "intruder" to 2, "thief" to 2, "stolen" to 2,
        "suspicious" to 2, "domestic" to 2, "violence" to 2,

        // Low-signal
        "danger" to 1, "scared" to 1, "following" to 1,
        "harassing" to 1, "threatening" to 1, "unsafe" to 1,
    )

    // ── Classification Engine ────────────────────────────────────────

    fun classify(transcript: String): ClassificationResult {
        val normalized = transcript.lowercase().trim()

        val medicalResult = scoreAgainst(normalized, MEDICAL_KEYWORDS)
        val fireResult = scoreAgainst(normalized, FIRE_KEYWORDS)
        val policeResult = scoreAgainst(normalized, POLICE_KEYWORDS)

        // Find the highest-scoring domain
        val results = listOf(
            Triple("Medical", medicalResult.first, medicalResult.second),
            Triple("Fire", fireResult.first, fireResult.second),
            Triple("Police", policeResult.first, policeResult.second),
        )

        val winner = results.maxByOrNull { it.second } ?: Triple("Medical", 0, emptyList<String>())

        // If no keywords matched at all, default to Medical with low confidence
        // (person might just be saying "help" — medical is the safest default)
        if (winner.second == 0) {
            return ClassificationResult(
                domain = "Medical",
                confidence = 0.3f,
                matchedKeywords = emptyList()
            )
        }

        // Normalize confidence: cap raw score at 10 → 1.0
        val maxPossibleScore = 10
        val confidence = (winner.second.toFloat() / maxPossibleScore).coerceIn(0.1f, 1.0f)

        return ClassificationResult(
            domain = winner.first,
            confidence = confidence,
            matchedKeywords = winner.third
        )
    }

    /**
     * Score a transcript against a keyword dictionary.
     * Returns (totalScore, matchedKeywords).
     *
     * Multi-word keywords (e.g., "heart attack") are checked first
     * to prevent partial matches on individual words.
     */
    private fun scoreAgainst(
        text: String,
        keywords: Map<String, Int>
    ): Pair<Int, List<String>> {
        var totalScore = 0
        val matched = mutableListOf<String>()

        // Sort by keyword length DESC so multi-word phrases are matched first
        val sorted = keywords.entries.sortedByDescending { it.key.length }

        for ((keyword, weight) in sorted) {
            if (text.contains(keyword)) {
                totalScore += weight
                matched.add(keyword)
            }
        }

        return Pair(totalScore, matched)
    }
}
