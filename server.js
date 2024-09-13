const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/completions";

async function getStockSummary() {
    try {
        const response = await axios.post(
            OPENAI_URL,
            {
                model: "gpt-4", 
                prompt: `Summarize today's stock market performance. Include: 
                - Overall market sentiment
                - Top performing sectors
                - Key events
                - Top gainers and losers 
                - Simplified explanation for beginners. 
                Return as JSON.`,
                max_tokens: 500,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].text;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}


app.get('/', async (req, res) => {
    try {
        const stockSummary = await getStockSummary();
        res.json(JSON.parse(stockSummary)); 
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stock summary' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});