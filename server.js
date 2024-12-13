import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
} from "firebase/firestore";
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


const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;


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
    // if (!ticker) {
    //     throw new Error("Ticker is required to fetch news articles");
    // }
    
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&time_from=${startDate}&apikey=${ALPHA_VANTAGE_API_KEY}`;
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

app.get('/articles', async (req, res) => {
    const ticker = req.query.ticker;
    try {
        const data = await fetchNewsArticles(ticker);
        if (data) {
            res.json({ data });
        } else {
            res.status(500).json({ error: "Failed to get articles" });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


