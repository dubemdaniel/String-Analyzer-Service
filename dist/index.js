"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
const storage = new Map();
// Utility Functions
function computeSHA256(str) {
    return crypto_1.default.createHash('sha256').update(str).digest('hex');
}
function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
}
function countUniqueCharacters(str) {
    return new Set(str).size;
}
function countWords(str) {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
}
function getCharacterFrequency(str) {
    const frequency = {};
    for (const char of str) {
        frequency[char] = (frequency[char] || 0) + 1;
    }
    return frequency;
}
function analyzeString(value) {
    const sha256_hash = computeSHA256(value);
    return {
        id: sha256_hash,
        value,
        properties: {
            length: value.length,
            is_palindrome: isPalindrome(value),
            unique_characters: countUniqueCharacters(value),
            word_count: countWords(value),
            sha256_hash,
            character_frequency_map: getCharacterFrequency(value)
        },
        created_at: new Date().toISOString()
    };
}
// 1. POST /strings - Create/Analyze String
app.post('/strings', (req, res) => {
    const { value } = req.body;
    // Validation
    if (!value && value !== '') {
        return res.status(400).json({ error: 'Missing "value" field in request body' });
    }
    if (typeof value !== 'string') {
        return res.status(422).json({ error: 'Invalid data type for "value" (must be string)' });
    }
    // Check if string already exists
    const hash = computeSHA256(value);
    if (storage.has(hash)) {
        return res.status(409).json({ error: 'String already exists in the system' });
    }
    // Analyze and store
    const data = analyzeString(value);
    storage.set(hash, data);
    res.status(201).json(data);
});
// 2. GET /strings/:string_value - Get Specific String
app.get('/strings/:string_value', (req, res) => {
    const stringValue = decodeURIComponent(req.params.string_value);
    const hash = computeSHA256(stringValue);
    const data = storage.get(hash);
    if (!data) {
        return res.status(404).json({ error: 'String does not exist in the system' });
    }
    res.status(200).json(data);
});
// 3. GET /strings - Get All Strings with Filtering
app.get('/strings', (req, res) => {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;
    console.log(req.query);
    // Validation
    if (is_palindrome && is_palindrome !== 'true' && is_palindrome !== 'false') {
        return res.status(400).json({ error: 'Invalid value for is_palindrome (must be true or false)' });
    }
    if (min_length && isNaN(Number(min_length))) {
        return res.status(400).json({ error: 'Invalid value for min_length (must be a number)' });
    }
    if (max_length && isNaN(Number(max_length))) {
        return res.status(400).json({ error: 'Invalid value for max_length (must be a number)' });
    }
    if (word_count && isNaN(Number(word_count))) {
        return res.status(400).json({ error: 'Invalid value for word_count (must be a number)' });
    }
    if (contains_character && typeof contains_character === 'string' && contains_character.length !== 1) {
        return res.status(400).json({ error: 'Invalid value for contains_character (must be a single character)' });
    }
    // Apply filters
    let results = Array.from(storage.values());
    if (is_palindrome !== undefined) {
        const isPalindromeFilter = is_palindrome === 'true';
        results = results.filter(item => item.properties.is_palindrome === isPalindromeFilter);
    }
    if (min_length) {
        const minLen = Number(min_length);
        results = results.filter(item => item.properties.length >= minLen);
    }
    if (max_length) {
        const maxLen = Number(max_length);
        results = results.filter(item => item.properties.length <= maxLen);
    }
    if (word_count) {
        const count = Number(word_count);
        results = results.filter(item => item.properties.word_count === count);
    }
    if (contains_character) {
        const char = String(contains_character);
        results = results.filter(item => item.value.includes(char));
    }
    // Build filters applied object
    const filters_applied = {};
    if (is_palindrome !== undefined)
        filters_applied.is_palindrome = is_palindrome === 'true';
    if (min_length)
        filters_applied.min_length = Number(min_length);
    if (max_length)
        filters_applied.max_length = Number(max_length);
    if (word_count)
        filters_applied.word_count = Number(word_count);
    if (contains_character)
        filters_applied.contains_character = String(contains_character);
    res.status(200).json({
        data: results,
        count: results.length,
        filters_applied
    });
});
// 4. GET /strings/filter-by-natural-language - Natural Language Filtering
app.get('/strings/filter-by-natural-language', (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }
    const lowerQuery = query.toLowerCase();
    const parsed_filters = {};
    // Parse natural language query
    try {
        // Check for palindrome
        if (lowerQuery.includes('palindrom')) {
            parsed_filters.is_palindrome = true;
        }
        // Check for word count
        if (lowerQuery.includes('single word')) {
            parsed_filters.word_count = 1;
        }
        else if (lowerQuery.includes('two word') || lowerQuery.includes('2 word')) {
            parsed_filters.word_count = 2;
        }
        else if (lowerQuery.includes('three word') || lowerQuery.includes('3 word')) {
            parsed_filters.word_count = 3;
        }
        // Check for length constraints
        const longerThanMatch = lowerQuery.match(/longer than (\d+)/);
        if (longerThanMatch) {
            parsed_filters.min_length = Number(longerThanMatch[1]) + 1;
        }
        const shorterThanMatch = lowerQuery.match(/shorter than (\d+)/);
        if (shorterThanMatch) {
            parsed_filters.max_length = Number(shorterThanMatch[1]) - 1;
        }
        // Check for specific character
        const containsMatch = lowerQuery.match(/contain(?:s|ing)? (?:the letter |the character )?([a-z])/);
        if (containsMatch) {
            parsed_filters.contains_character = containsMatch[1];
        }
        // Check for "first vowel" (typically 'a')
        if (lowerQuery.includes('first vowel')) {
            parsed_filters.contains_character = 'a';
        }
        // If no filters were parsed
        if (Object.keys(parsed_filters).length === 0) {
            return res.status(400).json({ error: 'Unable to parse natural language query' });
        }
        // Apply filters
        let results = Array.from(storage.values());
        if (parsed_filters.is_palindrome !== undefined) {
            results = results.filter(item => item.properties.is_palindrome === parsed_filters.is_palindrome);
        }
        if (parsed_filters.min_length) {
            results = results.filter(item => item.properties.length >= parsed_filters.min_length);
        }
        if (parsed_filters.max_length) {
            results = results.filter(item => item.properties.length <= parsed_filters.max_length);
        }
        if (parsed_filters.word_count) {
            results = results.filter(item => item.properties.word_count === parsed_filters.word_count);
        }
        if (parsed_filters.contains_character) {
            results = results.filter(item => item.value.toLowerCase().includes(parsed_filters.contains_character));
        }
        res.status(200).json({
            data: results,
            count: results.length,
            interpreted_query: {
                original: query,
                parsed_filters
            }
        });
    }
    catch (error) {
        return res.status(422).json({ error: 'Query parsed but resulted in conflicting filters' });
    }
});
// 5. DELETE /strings/:string_value - Delete String
app.delete('/strings/:string_value', (req, res) => {
    const stringValue = decodeURIComponent(req.params.string_value);
    const hash = computeSHA256(stringValue);
    if (!storage.has(hash)) {
        return res.status(404).json({ error: 'String does not exist in the system' });
    }
    storage.delete(hash);
    res.status(204).send();
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(` String Analysis API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map