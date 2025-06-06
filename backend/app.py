import os
from google import genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import re

# Load environment variables from .env file
load_dotenv()

# --- FastAPI App Initialization ---
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---
class ThemeRequest(BaseModel):
    theme: str

class WordsResponse(BaseModel):
    words: list[str]

# --- Gemini API Configuration ---
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file.")
    client = genai.Client(api_key=gemini_api_key)
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# --- API Endpoint ---
@app.post('/generate-words', response_model=WordsResponse)
async def generate_words(request: ThemeRequest):

    theme = request.theme

    if not theme:
        raise HTTPException(status_code=400, detail="Theme is required.")

    # --- Prompt Engineering for Gemini ---
    # We ask for more than 13 to have some buffer.
    # The prompt is very specific to get a clean, parsable output.
    prompt = f"""
    Generate exactly 25 one-word nouns related to the theme: '{theme}'.
    Include a balanced mix of:
    - Common, familiar nouns that are easy to give clues for
    - Funnier, quirkier, or more niche nouns that still make sense in casual conversation
    Avoid verbs, adjectives, or multi-word phrases.
    Output only the nouns, as a single comma-separated line, with no extra commentary or formatting.

    Example (theme: Ocean): Shark,Snorkel,Kraken,Coral,Flipper,Barnacle,Fish,Submarine,Tidepool,Bubble
    """

    try:
        # Call the Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        
        # --- Parse and Clean the Response ---
        # Clean up the text: remove newlines, asterisks, etc.
        raw_text = response.candidates[0].content.parts[0].text.strip().replace('\n', ',').replace('*', '')
        
        # Split into a list and clean each word
        # This regex split handles cases with or without spaces after commas
        word_list = [word.strip().capitalize() for word in re.split(r'\s*,\s*', raw_text) if word.strip()]
        
        if not word_list:
            raise HTTPException(status_code=500, detail="Failed to generate a valid word list from the theme.")
            
        print(f"Generated {len(word_list)} words for theme '{theme}': {word_list[:5]}...")
        
        # Return the clean list
        return WordsResponse(words=word_list)

    except Exception as e:
        print(f"An error occurred while calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")