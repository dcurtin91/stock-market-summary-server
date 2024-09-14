import OpenAI from "openai";
import request from 'request-promise'; // Use request-promise for better async handling
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const openai = new OpenAI({ apiKey: `${OPENAI_API_KEY}` });

const fetchAlphaVantageData = async () => {
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`;

    try {
        const response = await request.get({
            url: url,
            json: true,
            headers: {'User-Agent': 'request'}
        });
        console.log("Data captured");
        return response;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};

const getCompletion = async (data) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: `Summarize today's stock market performance. Include: 
                - 4 to 5 sentence summary
                - Notable sector performances
                - Top gainers and losers, 2 to 3 each 
                Return as JSON: ${JSON.stringify(data)}`,
                },
            ],
        });
        return completion.choices[0].message;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
};

const main = async () => {
    const data = await fetchAlphaVantageData();
    if (data) {
        const summary = await getCompletion(data);
        console.log(summary);
    }
};

main();
