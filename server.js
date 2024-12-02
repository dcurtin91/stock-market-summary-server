import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
  } from "firebase/firestore";
import OpenAI from "openai";
import request from 'request-promise'; 
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "stock-market-summarizer.firebaseapp.com",
    projectId: "stock-market-summarizer",
    storageBucket: "stock-market-summarizer.appspot.com",
    messagingSenderId: "219851290952",
    appId: "1:219851290952:web:bad6129a8901a5e4e61b7d",
    measurementId: "G-B9BJC82143"
  };

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const date = new Date();
let day = date.getDate();
let month = date.getMonth() + 1;
let year = date.getFullYear();
let currentDate = `${year}-${month}-${day}`;

app.use(cors({
  origin: '*' 
}));


const fetchAlphaVantageData = async () => {
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`;

    try {
        const response = await request.get({
            url: url,
            json: true,
            headers: { 'User-Agent': 'request' }
        });
        console.log("Alpha Vantage Data Captured");
        return response;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};


const getCompletion = async (data) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    "role": "user",
                    "content": `Summarize today's stock market performance in the following JSON format (please do not include any copy before the json response):
                  
                    {
                        "summary": "<Brief summary of the market in 4 - 5 sentences.>",
                        "most_actively_traded": [
                            {"ticker": "<Ticker symbol>"},
                            // ... 2 other most actively traded
                        ],
                        "top_gainers": [
                            {"ticker": "<Ticker symbol>", "price": "<Price>", "change_amount": "<Change amount>", "change_percentage": "<Change percentage>", "volume": "<Volume>"},
                            // ... 2 other top gainers
                        ],
                        "top_losers": [
                            {"ticker": "<Ticker symbol>", "price": "<Price>", "change_amount": "<Change amount>", "change_percentage": "<Change percentage>", "volume": "<Volume>"},
                            // ... 2 other top losers
                        ],
                        "timestamp": "<Today's date is ${currentDate}. Provide timestamp in ISO 8601 format>"
                    }
                  
                    Here is the data: ${JSON.stringify(data)}`
                  }
            ],
        });
        console.log("OpenAI Summary Generated");
        return completion.choices[0].message.content;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};


app.get('/summarize-market', async (req, res) => {
    const data = await fetchAlphaVantageData();
    if (data) {
        const summary = await getCompletion(data);
        if (summary) {
            res.json({ summary });
            const docRef = doc(db, 'summaries', `${currentDate}`);
            const parsedSummary = JSON.parse(summary);
            setDoc(docRef, parsedSummary); 
        } else {
            res.status(500).json({ error: "Failed to generate summary from OpenAI" });
        }
    } else {
        res.status(500).json({ error: "Failed to fetch Alpha Vantage data" });
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


