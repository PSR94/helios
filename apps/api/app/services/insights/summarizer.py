from openai import OpenAI
from app.core.config import settings
import json

class InsightSummarizer:
    """
    Translates raw SQL results into a business narrative using LLM.
    """
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.LLM_API_KEY or "local-dev",
            base_url=settings.LLM_API_BASE,
        )
        self.model = settings.LLM_MODEL

    def summarize(self, query: str, sql: str, columns: list, rows: list):
        """
        Generates a concise narrative from tabular data.
        """
        # Limit the data passed to LLM to avoid context overflow for large results
        data_preview = rows[:20]

        if not settings.LLM_API_KEY:
            return self._summarize_without_llm(query=query, columns=columns, rows=rows)
        
        prompt = f"""You are a Staff Analytics Engineer at HELIOS. 
The user asked: "{query}"
The system generated and ran this SQL:
{sql}

The results are (top 20 rows):
Columns: {columns}
Rows: {data_preview}

Provide a concise "Business Insight Narrative" (2-3 sentences). 
Focus on:
1. Answering the user's question directly with numbers.
2. Identifying the main trend or interesting data point.
3. Keep it professional and technical, not robotic.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You provide expert analytical summaries of data results."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Could not generate insight: {str(e)}"

    def _summarize_without_llm(self, query: str, columns: list, rows: list) -> str:
        row_count = len(rows)
        if not rows:
            return f'No rows were returned for "{query}".'

        lead = f'The query returned {row_count} row{"s" if row_count != 1 else ""}.'
        if len(columns) >= 2:
            sample = ", ".join(f"{columns[i]}={rows[0][i]}" for i in range(min(len(columns), 3)))
            return f'{lead} The first result is {sample}. Configure `LLM_API_KEY` to enable richer AI narration.'

        return f'{lead} Configure `LLM_API_KEY` to enable richer AI narration.'

insight_summarizer = InsightSummarizer()
