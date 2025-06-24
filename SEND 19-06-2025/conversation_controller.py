import json
import random
import time
from API_openai import API_Call_openai

class ConversationController:
    def __init__(self, api_agent: API_Call_openai, agent_data: dict):
        self.api_agent = api_agent
        self.agent_data = agent_data

        # Conversation state
        self.total_dialogue = agent_data.get("metadata", {}).get("total_dialogue", 0)
        # Initialize conversation with system prompt
        raw_sys = agent_data.get("system_prompt", "")
        if isinstance(raw_sys, dict) and isinstance(raw_sys.get("content"), str):
            self.conversation = [raw_sys]
        else:
            self.conversation = [{"role": "system", "content": str(raw_sys)}]
3
        # Load templates and keywords
        self.base_prompt = agent_data["prompt_templates"]["base_prompt"]
        self.improv_prompt = agent_data["prompt_templates"]["improv_prompt"]
        self.keywords = agent_data["keywords"]
        self.sentence_structures = agent_data["sentence_structures"]

        # Questions and flow
        self.questions = {q["id"]: q["prompt"] for q in agent_data.get("questions", [])}
        self.flow = agent_data.get("conversation_flow", [])

        self.random_value = random.randint(0, 10_000_000_000) if agent_data.get("generate_random_value", False) else None

    def get_reinforcer(self) -> str:
        return random.choice(self.keywords["reinforcers"])

    def make_prompt(self, template: str, fact_text: str = None) -> str:
        prompt = template + (fact_text or "")
        for struct in self.sentence_structures:
            if random.random() <= struct.get("probability", 1):
                if struct["type"] == "dynamic":
                    key = "starters" if "aligns" in struct.get("construct", "") else "neg_starters"
                    snippet = random.choice(self.keywords[key])
                    prompt += " " + struct["construct"].replace(f"{{{key}}}", snippet)
                else:
                    prompt += " " + struct["sentence"]
        return prompt.strip()

    def step(self):
        entries = [e for e in self.flow if e.get("step") == self.total_dialogue]
        if not entries:
            return  # No more steps

        for entry in entries:
            self._execute_action(entry)

        # Only increment after all actions for the current step
        self.total_dialogue += 1

    def _execute_action(self, entry):
        action = entry.get("action")

        if action == "add_other_bubble":
            self._add_other_bubble(entry.get("message"))

        elif action == "add_other_bubble_delayed":
            time.sleep(entry.get("delay_ms", 0) / 1000.0)
            self._add_other_bubble(entry.get("message"))

        elif action == "add_instruction":
            self._add_other_bubble(entry.get("message"))

        elif action == "call_api":
            instr = entry.get("message_instruction", {})
            template_key = instr.get("template", "base_prompt")
            fact = instr.get("fact")

            # Build user-like prompt
            if template_key == "base_prompt":
                user_prompt = self.make_prompt(self.base_prompt, fact)
            else:
                user_prompt = self.make_prompt(self.improv_prompt)

            # Append user input
            self.conversation.append({"role": "user", "content": user_prompt})

            # Call API
            conv, pt, ct, tt, logs = self.api_agent.thinkAbout(
                message=user_prompt,
                conversation=self.conversation
            )
            self.conversation = conv
            last = self.conversation[-1]["content"]

            print(f"API Response: {last}")
            self._add_other_bubble(last)

        elif action == "update_question_number":
            self._update_question_number(entry.get("question_number"))

        elif action == "update_question":
            self._update_question(entry.get("message"))

        elif action == "update_AI_text":
            self._update_AI_text(entry.get("variable"))

        return True

    # helpers
    def _add_other_bubble(self, text: str):
        print(f"AI: {text}")
        self.conversation.append({"role": "assistant", "content": text})

    def _update_question_number(self, num: int):
        print(f"Update Question Number -> {num}")

    def _update_question(self, text: str):
        print(f"Update Question -> {text}")

    def _update_AI_text(self, var_name: str):
        print(f"Update AI Text from variable: {var_name}")

# End ConversationController
