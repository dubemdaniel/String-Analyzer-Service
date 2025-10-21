# String Analysis API

A RESTful API service that analyzes strings and stores their computed properties using Express.js and TypeScript.

##  Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Create project directory and navigate to it:**
```bash
mkdir string-analysis-api
cd string-analysis-api
```

2. **Initialize the project:**
Copy the `package.json`, `tsconfig.json`, and `src/index.ts` files to your project.

3. **Install dependencies:**
```bash
npm install
```

4. **Run in development mode:**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

5. **Build for production:**
```bash
npm run build
npm start
```

## 📋 API Endpoints

### 1. Create/Analyze String
**POST** `/strings`

Analyzes a string and stores its properties.

**Request:**
```json
{
  "value": "hello world"
}
```

**Response (201 Created):**
```json
{
  "id": "b94d27b9...",
  "value": "hello world",
  "properties": {
    "length": 11,
    "is_palindrome": false,
    "unique_characters": 8,
    "word_count": 2,
    "sha256_hash": "b94d27b9...",
    "character_frequency_map": {
      "h": 1,
      "e": 1,
      "l": 3,
      "o": 2,
      " ": 1,
      "w": 1,
      "r": 1,
      "d": 1
    }
  },
  "created_at": "2025-10-20T10:00:00Z"
}
```

**Error Responses:**
- `400`: Missing "value" field
- `422`: Invalid data type (not a string)
- `409`: String already exists

### 2. Get Specific String
**GET** `/strings/{string_value}`

Retrieves a previously analyzed string.

**Example:**
```bash
curl http://localhost:3000/strings/hello%20world
```

**Response (200 OK):**
Returns the same structure as POST response.

**Error Response:**
- `404`: String not found

### 3. Get All Strings with Filtering
**GET** `/strings?[filters]`

Retrieves all strings with optional filters.

**Query Parameters:**
- `is_palindrome` (boolean): Filter by palindrome status
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character to search for

**Example:**
```bash
curl "http://localhost:3000/strings?is_palindrome=true&min_length=5"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "hash1",
      "value": "radar",
      "properties": { ... },
      "created_at": "2025-10-20T10:00:00Z"
    }
  ],
  "count": 1,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5
  }
}
```

### 4. Natural Language Filtering
**GET** `/strings/filter-by-natural-language?query=[natural_query]`

Filter strings using natural language queries.

**Supported Queries:**
- `"all single word palindromic strings"`
- `"strings longer than 10 characters"`
- `"palindromic strings that contain the first vowel"`
- `"strings containing the letter z"`

**Example:**
```bash
curl "http://localhost:3000/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"
```

**Response (200 OK):**
```json
{
  "data": [...],
  "count": 3,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

### 5. Delete String
**DELETE** `/strings/{string_value}`

Deletes a string from the system.

**Example:**
```bash
curl -X DELETE http://localhost:3000/strings/hello%20world
```

**Response (204 No Content):**
Empty response body.

**Error Response:**
- `404`: String not found

## 🧪 Testing with cURL

```bash
# Create strings
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'

curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "hello world"}'

# Get specific string
curl http://localhost:3000/strings/racecar

# Get all palindromes
curl "http://localhost:3000/strings?is_palindrome=true"

# Natural language query
curl "http://localhost:3000/strings/filter-by-natural-language?query=single%20word%20palindromic%20strings"

# Delete a string
curl -X DELETE http://localhost:3000/strings/racecar
```

##  Project Structure

```
string-analysis-api/
├── src/
│   └── index.ts          # Main application file
├── dist/                 # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 How It Works

### String Analysis
When a string is submitted, the API computes:
1. **Length**: Total character count
2. **Is Palindrome**: Checks if string reads same forwards/backwards (case-insensitive)
3. **Unique Characters**: Count of distinct characters
4. **Word Count**: Number of whitespace-separated words
5. **SHA-256 Hash**: Used as unique identifier
6. **Character Frequency**: Map of each character's occurrence count

### Storage
Currently uses in-memory storage (Map). For production, integrate a database like:
- MongoDB
- PostgreSQL
- Redis

### Natural Language Processing
The API uses pattern matching to interpret queries like:
- "palindromic" → `is_palindrome=true`
- "single word" → `word_count=1`
- "longer than 10" → `min_length=11`
- "containing the letter x" → `contains_character=x`

##  Next Steps

1. **Add Database**: Replace in-memory storage with MongoDB or PostgreSQL
2. **Add Tests**: Implement unit and integration tests with Jest
3. **Add Validation**: Use libraries like Zod or Joi for request validation
4. **Add Documentation**: Integrate Swagger/OpenAPI for API docs
5. **Add Rate Limiting**: Prevent API abuse
6. **Add Authentication**: Secure endpoints with JWT tokens

## 📝 License

MIT