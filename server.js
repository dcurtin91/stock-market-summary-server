import OpenAI from "openai";
import request from 'request-promise'; 
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(cors({
  origin: 'https://stock-market-summarizer.netlify.app' 
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
                    role: "user",
                    content: `Summarize today's stock market performance. Format the JSON as the following:
                        - 'summary': 4 to 5 sentence summary.
                        - 'sectors': Notable sector performances (2 - 3 sentences).
                        - 'top_gainers': Top gainers, 2 to 3 each.
                        - 'top_losers': Top losers, 2 to 3 each.
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


