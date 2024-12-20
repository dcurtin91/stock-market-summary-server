import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    query,
    collection,
    orderBy,
    getDocs,
    limit,
} from "firebase/firestore";
import request from 'request-promise';
import OpenAI from "openai";
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


const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });


const date = new Date();
let day = date.getDate();
//let week_ago = date.getDate() - 7;
let month = date.getMonth() + 1;
let year = date.getFullYear();
let currentDate = `${year}-${month}-${day}`;
let startDate = `${year}${month}01T0130`; //this needs to be fixed!!!

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


const fetchNewsArticles = async (ticker) => {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&time_from=${startDate}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(url);
    try {
        const response = await request.get({
            url: url,
            json: true,
            header: { 'User-Agent': 'request' }
        });
        console.log("Articles captured");
        return response;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};

const getAnalysis = async (articles, ticker) => {
    try {

        const limitedFeed = articles.feed.slice(0, 10);

        const tickerSentiment = limitedFeed.map((item) => ({
            overall_sentiment_label: item.overall_sentiment_label || "Neutral",
            overall_sentiment_score: item.overall_sentiment_score || "0",
            sentiments: item.ticker_sentiment?.map((sentiment) => ({
                ticker: sentiment?.ticker || "Unknown",
                sentiment_label: sentiment?.ticker_sentiment_label || "Neutral",
                sentiment_score: sentiment?.ticker_sentiment_score || "0",
            })) || [],
        }));

        
        const formattedSentiment = JSON.stringify(tickerSentiment, null, 2);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: `Based on the following sentiment data for stock ${ticker}, provide a summary in JSON format:
                    ${formattedSentiment}
                    Please respond in this format:
                    {
                        "analysis": "<Brief summary of the overall sentiment towards ${ticker}. 5-6 sentences.>",
                        "timestamp": "<Today's date is ${currentDate}. Provide timestamp in ISO 8601 format>",
                    }`,
                    
                },
            ],
        });
        console.log("OPENAI Summary Generated");
        return completion.choices[0].message.content;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};

const writeAnalysis = async (analysis) => {
    const docRef = doc(db, 'ai', currentDate);
    const parsedAnalysis = JSON.parse(analysis);
    setDoc(docRef, parsedAnalysis);
};

app.get('/summarize-market', async (req, res) => {
    try {
        const data = await fetchAlphaVantageData();
        if (data) {
            const docRef = doc(db, 'summaries', currentDate);

            await setDoc(docRef, { ...data, timestamp: new Date().toISOString() });

            res.json({ message: "Data saved to Firestore", data });
        } else {
            res.status(500).json({ error: "Failed to fetch Alpha Vantage data" });
        }
    } catch (err) {
        console.error("Error while saving data to Firestore:", err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});

app.get('/news1', async (req, res) => {
    try {
        const tickerQuery = query(
            collection(db, "summaries"),
            orderBy("timestamp", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(tickerQuery);
        let ticker;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            ticker = data.most_actively_traded[1].ticker;
        });

        if (!ticker) {
            return res.status(404).json({ error: "No ticker found in the latest summaries." });
        }

        console.log(`Most recent ticker fetched: ${ticker}`);

        const articles = await fetchNewsArticles(ticker);

        const docRef = doc(db, 'articles', currentDate);
        await setDoc(docRef, { ...articles, timestamp: new Date().toISOString() });
        res.json({ message: "Articles saved to Firestore", articles });

        const analysis = await getAnalysis(articles, ticker);
        if (analysis) {
            writeAnalysis(analysis);
        } else {
            res.status(500).json({ error: "tis an error"});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "internal server error", details: err.message });
    }
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


