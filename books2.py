from fastapi import FastAPI, Path, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from starlette import status

app = FastAPI()

class book:
    def __init__(self, id: int, title: str, author: str, description: str, rating: int, publish_date: int):
        self.id = id
        self.title = title
        self.author = author
        self.description = description
        self.rating = rating
        self.publish_date = publish_date

class BookRequest(BaseModel):
    id: Optional[int] = Field(description='Id is not needed on create', default = None)
    title: str = Field(min_length=3)
    author: str = Field(min_length=1)
    description: str = Field(min_length=1, max_length=100)
    rating: int = Field(gt = 0, lt = 6)
    publish_date: int =  Field(gt = 0)

    model_config = {
        "json_schema_extra" : {
            "example" : {
                "title" : "A New Book",
                "author" : "codingwith krunal",
                "description" : "A new description of a book",
                "rating" : 4,
                "publish_date" : 2012
            }
        }
    }


BOOKS = [
    book(1, "1984", "George Orwell", "Dystopian novel", 3, 2008),
    book(2, "To Kill a Mockingbird", "Harper Lee", "Classic novel", 4, 2012),
    book(3, "The Great Gatsby", "F. Scott Fitzgerald", "Novel set in the 1920s", 4, 2016),
    book(4, "Harry Potter and the Sorcerer's Stone", "J.K. Rowling", "Fantasy adventure", 3, 2020),
    book(5, "The Hobbit", "J.R.R. Tolkien", "Fantasy journey", 3, 2024)
]

@app.get("/books", status_code=status.HTTP_200_OK)
async def read_all_books():
    return BOOKS

@app.get("/book/{book_id}", status_code=status.HTTP_200_OK)
async def read_book(book_id: int = Path(gt = 0, lt = 10)):
    for b in BOOKS:
        if b.id == book_id:
            return b
    raise HTTPException(status_code=404, detail='Item not found.')

@app.put("/books/update-book", status_code=status.HTTP_204_NO_CONTENT)
async def update_book(book: BookRequest):
    book_changed = False
    for i in range(len(BOOKS)):
        if BOOKS[i].id == book.id:
            BOOKS[i] = book
            book_changed = True
    if not book_changed:
        raise HTTPException(status_code=404, detail = 'Item not found')

@app.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: int):
    book_changed = False
    for i in range(len(BOOKS)):
        if BOOKS[i].id == book_id:
            BOOKS.pop(i)
            book_changed = True
            break
    if not book_changed:
        raise HTTPException(status_code=404, detail = 'Item not found')

@app.get("/books/by-rating", status_code=status.HTTP_200_OK)
async def read_book_by_rating(rating: int = Query(gt=0, lt=6)):
    books_to_return = []
    for b in BOOKS:
        if b.rating == rating:
            books_to_return.append(b)
    return books_to_return


@app.get("/books/publish", status_code=status.HTTP_200_OK)
async def book_by_publish_date(publish_date: int = Query(gt = 2000, lt = 2025)):
    books_to_return = []
    for b in BOOKS:
        if b.publish_date == publish_date:
            books_to_return.append(b)
    return books_to_return


@app.get("/book/{book_id}", status_code=status.HTTP_200_OK)
async def read_book(book_id: int):
    for b in BOOKS:
        if b.id == book_id:
            return b

@app.post("/create-book", status_code=status.HTTP_201_CREATED)
async def create_book(book_request: BookRequest):
    new_book = book(**book_request.model_dump())
    BOOKS.append(find_book_id(new_book))

def find_book_id(Book: book):
    if len(BOOKS) > 0:
        Book.id = BOOKS[-1].id + 1
    else:
        Book.id = 1
    return Book

"""
@app.post("/create-book")
async def create_books(book_request : dict = Body(...)):
    new_book = book(
        id=book_request["id"],
        title=book_request["title"],
        author=book_request["author"],
        description=book_request["description"],
        rating=book_request["rating"]
    )
    BOOKS.append(new_book)
    return {"message": "Book created successfully", "book": new_book.__dict__}
"""