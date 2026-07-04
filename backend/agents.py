from crewai import Agent, LLM
from crewai_tools import ScrapeWebsiteTool

# 1. Update the model string to match your exact local Ollama name
# Replace "gemma:2b" with the exact name shown when you run 'ollama list' in your terminal
# Initializing the local LLM using the OpenAI-compatible endpoint workaround
llm = LLM(
    model="gemma4:e2b",
    base_url="http://localhost:11434/v1", # <-- Add /v1 to hit the OpenAI-compatible endpoint
    api_key="ollama",                     # <-- Dummy key required by the OpenAI provider
    provider="openai"                     # <-- Tricks LiteLLM into routing the request correctly
)

# Web Scraper Agent
# Extracts semantic website content and removes boilerplate HTML.
# 2. Keep ONLY the Scrape tool to bypass search engine blocks (403 errors)
scrape_tool = ScrapeWebsiteTool()

class LeadAgents:
    # Research Agent
    # Builds a structured company profile from scraped content.
    # Identifies opportunities and business pain points.
    def researcher_agent(self) -> Agent:
        return Agent(
            role="Senior B2B Lead Researcher",
            goal="Analyze the target company and extract key value propositions, pain points, and strategic insights.",
            backstory="An expert business analyst and researcher. You excel at finding crucial details about a company "
                      "to understand their core business, target audience, and potential challenges.",
            verbose=True,
            allow_delegation=False,
            llm=llm,
            tools=[scrape_tool]  # Removed search_tool here
        )
    
    # Pitch Writer
    # Generates personalized outreach.
    def pitch_writer_agent(self) -> Agent:
        return Agent(
            role="Expert B2B Copywriter",
            goal="Craft a compelling, highly personalized B2B pitch based on the researcher's findings.",
            backstory="A world-class sales copywriter who specializes in cold outreach and B2B communication. "
                      "You know exactly how to structure a pitch to grab attention, build credibility, and prompt a response.",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )