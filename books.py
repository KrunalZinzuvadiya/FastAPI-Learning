from fastapi import Body, FastAPI

app = FastAPI()

BOOKS = [
    {'title': 'title_one', 'author': 'author_one', 'category': 'science'},
    {'title': 'title_two', 'author': 'author_two', 'category': 'fiction'},
    {'title': 'title_three', 'author': 'author_three', 'category': 'history'},
    {'title': 'title_four', 'author': 'author_four', 'category': 'science'},
    {'title': 'title_five', 'author': 'author_five', 'category': 'fiction'},
    {'title': 'title_six', 'author': 'author_six', 'category': 'history'}
]


@app.get("/books")
async def read_all_book():
    return BOOKS

# path parameters is book_title
@app.get("/books/my_book")
async def read_my_book():
    return {'book_title' : 'My favorite Book'}

#query parameter
@app.get("/books/{book_author}/")
async def read_by_author_category(book_author: str, category: str):
    books_to_return = []
    for book in BOOKS:
        if book['author'] == book_author:
            if book['category'] == category:
                books_to_return.append(book)
    return books_to_return

#path parameter
@app.get("/books/{book_title}")
async def read_book_by_param(book_title: str):
    for book in BOOKS:
        if book['title'] == book_title:
            return book
    return {"error": "Book not found"}

#query parameter
@app.get("/books/")
async def read_book_by_query(category: str):
    books_to_return = []
    for book in BOOKS:
        if book['category'] == category:
            books_to_return.append(book)
    return books_to_return


@app.post("/books/create_book")
async def create_book(new_book= Body()):
    BOOKS.append(new_book)
    return {"message": "Book created successfully", "book": new_book}

@app.put("/books/update_book")
async def update_book(updated_book = Body()):
    for i in range(len(BOOKS)):
        if BOOKS[i]['title'] == updated_book['title']:
            BOOKS[i] = updated_book


@app.delete("/books/delete_book/{book_title}")
async def delete_book(book_title: str):
    for i in range(len(BOOKS)):
        if BOOKS[i]['title'] == book_title:
            BOOKS.pop(i)
            break

@app.get("/books/by_author/{author}")
async def read_books_by_author(author: str):
    book_to_return = []
    for book in BOOKS:
        if book['author'] == author:
            book_to_return.append(book)
    return book_to_return if book_to_return else {"error": "No books found by this author"}





