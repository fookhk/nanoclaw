---
description: LazyLibrarian integration — search for and add books to LazyLibrarian
triggers:
  - add book
  - search book
  - find book
---

# LazyLibrarian Integration

You can search for and add books to LazyLibrarian using the API. The base URL and API key are available as environment variables.

## Environment Variables

- `LAZYLIBRARIAN_URL` — base URL of the LazyLibrarian instance (e.g. `http://192.168.1.100:5299`)
- `LAZYLIBRARIAN_API_KEY` — API key from LazyLibrarian Settings > Interface

## Adding a Book

When a user says **"add book [title]"** (or **"@Andy add book [title]"**):

1. **Search** for the book by title to find its ID:
   ```bash
   curl -s "${LAZYLIBRARIAN_URL}/api?apikey=${LAZYLIBRARIAN_API_KEY}&cmd=searchBook&name=TITLE_URL_ENCODED"
   ```
   The response is JSON with a list of results. Each result has a `bookid` field.

2. **Pick the best match** — use the first result, or the one whose title and author best match what the user asked for.

3. **Add the book** using its `bookid`:
   ```bash
   curl -s "${LAZYLIBRARIAN_URL}/api?apikey=${LAZYLIBRARIAN_API_KEY}&cmd=addBook&id=BOOKID"
   ```

4. **Report back** — tell the user the book title and author that was added, or explain if nothing was found.

## Example Bash Sequence

```bash
# URL-encode the title
TITLE="The Martian"
ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$TITLE")

# Search
RESULTS=$(curl -s "${LAZYLIBRARIAN_URL}/api?apikey=${LAZYLIBRARIAN_API_KEY}&cmd=searchBook&name=${ENCODED}")
echo "$RESULTS"

# Extract first bookid (using jq if available, or python3)
BOOKID=$(echo "$RESULTS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['bookid'])" 2>/dev/null)

# Add the book
curl -s "${LAZYLIBRARIAN_URL}/api?apikey=${LAZYLIBRARIAN_API_KEY}&cmd=addBook&id=${BOOKID}"
```

## Error Handling

- If `LAZYLIBRARIAN_URL` or `LAZYLIBRARIAN_API_KEY` are empty, tell the user they need to set these in `.env`.
- If the search returns no results, tell the user no match was found and ask them to try a different title or author.
- If the add call fails, show the error from the API response.
