import OpenAI from "openai";
import dotenv from 'dotenv'
dotenv.config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: `${OPENAI_API_KEY}` });



const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
            role: "user",
            content: "Summarize yesterday's stock market performance.",
        },
      
    ],
});

console.log(completion.choices[0].message);