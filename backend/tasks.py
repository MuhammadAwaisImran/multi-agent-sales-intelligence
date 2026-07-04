from crewai import Task

class LeadTasks:
    def research_task(self, agent, company_name: str, company_url: str, context: str) -> Task:
        description = f"""
        Conduct thorough research on the target company: '{company_name}'.
        Website (if provided): '{company_url}'
        Additional Context: '{context}'
        
        Your task is to identify:
        1. The company's core offering and target audience.
        2. Potential pain points they might be experiencing.
        3. How our B2B services (inferred from the context, or generally as an AI solutions provider) could add value to them.
        
        Provide a concise yet detailed summary of these findings.
        """
        
        return Task(
            description=description,
            expected_output="A structured summary of the company's business model, target audience, pain points, and potential value alignment.",
            agent=agent
        )
    
    def pitch_task(self, agent, company_name: str) -> Task:
        description = f"""
        Using the research provided, write a highly personalized, compelling B2B email pitch addressed to a decision-maker at '{company_name}'.
        
        The pitch must:
        - Have an attention-grabbing subject line.
        - Open with a personalized hook based on the research.
        - Clearly state the value proposition and how we can solve their specific pain points.
        - End with a clear, low-friction Call to Action (CTA).
        - Maintain a professional, confident, yet conversational tone.
        """
        return Task(
            description=description,
            expected_output="A complete B2B cold outreach email, including a subject line and body paragraphs.",
            agent=agent
        )
