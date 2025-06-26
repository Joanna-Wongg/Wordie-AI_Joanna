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

        # Load templates and keywords
        self.base_prompt = agent_data.get("prompt_templates", {}).get("base_prompt", "")
        self.improv_prompt = agent_data.get("prompt_templates", {}).get("improv_prompt", "")
        self.keywords = agent_data.get("keywords", {})
        self.sentence_structures = agent_data.get("sentence_structures", [])

        # Questions and flow
        self.questions = {q["id"]: q["prompt"] for q in agent_data.get("questions", [])}
        self.flow = agent_data.get("conversation_flow", [])

        self.random_value = random.randint(0, 10_000_000_000) if agent_data.get("generate_random_value",
                                                                                False) else None

        # Test for pre scripted
        self.mode = agent_data.get("mode", "api")

    def get_reinforcer(self) -> str:
        reinforcers = self.keywords.get("reinforcers")
        return random.choice(reinforcers)

    def make_prompt(self, template: str, fact_text: str = None, mode: str = "confirm") -> str:
        prompt = template + (fact_text or "")

        for struct in self.sentence_structures:
            if random.random() <= struct.get("probability", 1):
                if struct["type"] == "dynamic":
                    text = struct.get("construct", "")

                    # Replace all types of starter placeholders found in text
                    for placeholder_key in ["starters", "neutral_starters", "neg_starters"]:
                        if f"{{{placeholder_key}}}" in text:
                            snippets = self.keywords.get(placeholder_key, [""])
                            snippet = random.choice(snippets)
                            text = text.replace(f"{{{placeholder_key}}}", snippet)

                else:
                    # For static types, just use the 'sentence'
                    text = struct.get("sentence", "")

                prompt += " " + text

        return prompt.strip()

    def process_user_input(self, user_message: str):
        """Process user input and return the appropriate response"""
        # Add user message to conversation
        self.conversation.append({"role": "user", "content": user_message})

        # Execute current step
        self.step()

        # Don't return anything - let Flask route handle getting the response

    def step(self):
        """Execute the current step"""
        entries = [e for e in self.flow if e.get("step") == self.total_dialogue]
        if not entries:
            return  # No more steps

        for entry in entries:
            self._execute_action(entry)

        # Only increment after all actions for the current step
        self.total_dialogue += 1

    def _execute_action(self, entry):
        action = entry.get("action")

        if self.mode == "pre-scripted":
            # Pre-scripted mode: Only support bubble actions (no API)
            if action in ("add_other_bubble", "add_other_bubble_delayed", "add_instruction"):
                if action == "add_other_bubble_delayed":
                    time.sleep(entry.get("delay_ms", 0) / 1000.0)
                self._add_other_bubble(entry.get("message"))
            return None

        if action == "add_other_bubble":
            self._add_other_bubble(entry.get("message"))
            return None

        elif action == "add_instruction":
            self._add_other_bubble(entry.get("message"))
            return None

        elif action == "call_api":
            instr = entry.get("message_instruction", {})
            template_key = instr.get("template", "base_prompt")
            fact = instr.get("fact")
            add_reinforcer = instr.get("add_reinforcer", False)

            # Build user-like prompt
            if template_key == "base_prompt":
                user_prompt = self.make_prompt(self.base_prompt, fact)
            else:
                user_prompt = self.make_prompt(self.improv_prompt)

            # Add reinforcer if specified
            if add_reinforcer:
                reinforcer = self.get_reinforcer()
                user_prompt += f" {reinforcer}"

            # Call API
            try:
                model = self.agent_data.get("model")
                conversation, prompt_tokens, completion_tokens, total_tokens, logprobs_list = self.api_agent.thinkAbout(
                    message=user_prompt,
                    conversation=self.conversation,
                    model=model
                )
                self.conversation = conversation
                last = self.conversation[-1]["content"]

                print(f"API Response: {last}")  # Keep console logging
                # The response is now in self.conversation, Flask route will find it

            except Exception as e:
                print(f"Error calling API: {e}")
                error_response = "I'm having trouble responding right now."
                self.conversation.append({"role": "assistant", "content": error_response})

        elif action == "add_other_bubble_delayed":
            time.sleep(entry.get("delay_ms", 0) / 1000.0)
            self._add_other_bubble(entry.get("message"))
            return None

        elif action == "update_question_number":
            self._update_question_number(entry.get("question_number"))
            return None

        elif action == "update_question":
            self._update_question(entry.get("message"))
            return None

        elif action == "update_AI_text":
            self._update_AI_text(entry.get("variable"))
            return None

        return None

    # Helper methods
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