from fastapi import FastAPI

app = FastAPI(
    title="PhiaHQ API",
    version="1.0.0"
)

@app.get("/health")
async def health():
    return {"message": "Alive!"}
