from crewai import Crew, Process
from agents import LeadAgents
from tasks import LeadTasks
from dotenv import load_dotenv

load_dotenv()

class PitchCrew:
    # Orchestrator
    # Coordinates execution between all specialized agents.
    def __init__(self, company_name: str, company_url: str = "", context: str = ""):
        self.company_name = company_name
        self.company_url = company_url
        self.context = context

    def run(self):
        agents = LeadAgents()
        tasks = LeadTasks()

        researcher = agents.researcher_agent()
        pitch_writer = agents.pitch_writer_agent()

        research_task = tasks.research_task(
            researcher, 
            self.company_name, 
            self.company_url, 
            self.context
        )
        
        pitch_task = tasks.pitch_task(
            pitch_writer, 
            self.company_name
        )

        crew = Crew(
            agents=[researcher, pitch_writer],
            tasks=[research_task, pitch_task],
            process=Process.sequential,
            verbose=True
        )

        result = crew.kickoff()
        return result
